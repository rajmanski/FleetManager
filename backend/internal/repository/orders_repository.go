package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/orders"
)

type OrdersRepository struct {
	queries sqlc.Querier
}

func NewOrdersRepository(queries sqlc.Querier) *OrdersRepository {
	return &OrdersRepository{queries: queries}
}

func toNullOrdersStatus(s string) sqlc.NullOrdersStatus {
	if strings.TrimSpace(s) == "" {
		return sqlc.NullOrdersStatus{}
	}
	return sqlc.NullOrdersStatus{
		OrdersStatus: sqlc.OrdersStatus(s),
		Valid:        true,
	}
}

func (r *OrdersRepository) ListOrders(ctx context.Context, query orders.ListOrdersQuery) ([]orders.Order, int64, error) {
	offset := (query.Page - 1) * query.Limit
	statusFilter := query.StatusFilter
	statusColumnValue := interface{}(statusFilter)
	if statusFilter == "" {
		statusColumnValue = ""
	}
	searchFilter := query.Search
	searchColumnValue := interface{}(searchFilter)
	if searchFilter == "" {
		searchColumnValue = ""
	}

	rows, err := r.queries.ListOrders(ctx, sqlc.ListOrdersParams{
		Column1: statusColumnValue,
		Status:  toNullOrdersStatus(statusFilter),
		Column3: searchColumnValue,
		LOWER:   searchFilter,
		CONCAT:  searchFilter,
		Limit:   query.Limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.CountOrders(ctx, sqlc.CountOrdersParams{
		Column1: statusColumnValue,
		Status:  toNullOrdersStatus(statusFilter),
		Column3: searchColumnValue,
		LOWER:   searchFilter,
		CONCAT:  searchFilter,
	})
	if err != nil {
		return nil, 0, err
	}

	result := make([]orders.Order, 0, len(rows))
	for _, row := range rows {
		result = append(result, mapListOrdersRow(row))
	}
	return result, total, nil
}

func (r *OrdersRepository) GetOrderByID(ctx context.Context, orderID int64) (orders.Order, error) {
	row, err := r.queries.GetOrderByID(ctx, int32(orderID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return orders.Order{}, orders.ErrOrderNotFound
		}
		return orders.Order{}, err
	}
	return mapGetOrderByIDRow(row), nil
}

func (r *OrdersRepository) CreateOrder(ctx context.Context, input orders.CreateOrderRequest) (int64, error) {
	status := "New"
	if input.Status != nil && *input.Status != "" {
		status = *input.Status
	}
	id, err := r.queries.CreateOrder(ctx, sqlc.CreateOrderParams{
		ClientID:         int32(input.ClientID),
		OrderNumber:      strings.TrimSpace(input.OrderNumber),
		DeliveryDeadline: toNullTimeFromString(input.DeliveryDeadline),
		TotalPricePln:    toNullStringFromFloat64(input.TotalPricePln),
		Status:           toNullOrdersStatus(status),
	})
	if err != nil {
		if isDuplicateEntryError(err) {
			return 0, orders.ErrOrderNumberExists
		}
		return 0, err
	}
	return id, nil
}

func (r *OrdersRepository) UpdateOrder(ctx context.Context, orderID int64, input orders.UpdateOrderRequest) error {
	status := "New"
	if input.Status != nil && *input.Status != "" {
		status = *input.Status
	}
	rows, err := r.queries.UpdateOrder(ctx, sqlc.UpdateOrderParams{
		ClientID:         int32(input.ClientID),
		OrderNumber:      strings.TrimSpace(input.OrderNumber),
		DeliveryDeadline: toNullTimeFromString(input.DeliveryDeadline),
		TotalPricePln:    toNullStringFromFloat64(input.TotalPricePln),
		Status:           toNullOrdersStatus(status),
		OrderID:          int32(orderID),
	})
	if err != nil {
		if isDuplicateEntryError(err) {
			return orders.ErrOrderNumberExists
		}
		return err
	}
	if rows == 0 {
		return orders.ErrOrderNotFound
	}
	return nil
}

func (r *OrdersRepository) CancelOrder(ctx context.Context, orderID int64) error {
	rows, err := r.queries.CancelOrderByID(ctx, int32(orderID))
	if err != nil {
		return err
	}
	if rows == 0 {
		return orders.ErrOrderNotFound
	}
	return nil
}

func mapListOrdersRow(row sqlc.ListOrdersRow) orders.Order {
	o := orders.Order{
		ID:            int64(row.OrderID),
		ClientID:      int64(row.ClientID),
		OrderNumber:   row.OrderNumber,
		Status:        string(row.Status.OrdersStatus),
		ClientCompany: row.ClientCompanyName,
	}
	if row.CreationDate.Valid {
		t := row.CreationDate.Time
		o.CreationDate = &t
	}
	if row.DeliveryDeadline.Valid {
		t := row.DeliveryDeadline.Time
		o.DeliveryDeadline = &t
	}
	if row.TotalPricePln.Valid {
		var f float64
		fmt.Sscanf(row.TotalPricePln.String, "%f", &f)
		o.TotalPricePln = &f
	}
	if row.CargoTypes.Valid {
		o.CargoTypes = row.CargoTypes.String
	}
	return o
}

func mapGetOrderByIDRow(row sqlc.GetOrderByIDRow) orders.Order {
	o := orders.Order{
		ID:          int64(row.OrderID),
		ClientID:    int64(row.ClientID),
		OrderNumber: row.OrderNumber,
		Status:      string(row.Status.OrdersStatus),
	}
	if row.CreationDate.Valid {
		t := row.CreationDate.Time
		o.CreationDate = &t
	}
	if row.DeliveryDeadline.Valid {
		t := row.DeliveryDeadline.Time
		o.DeliveryDeadline = &t
	}
	if row.TotalPricePln.Valid {
		var f float64
		fmt.Sscanf(row.TotalPricePln.String, "%f", &f)
		o.TotalPricePln = &f
	}
	if row.ClientCompanyName.Valid {
		o.ClientCompany = row.ClientCompanyName.String
	}
	if row.RouteID.Valid {
		rid := int64(row.RouteID.Int32)
		o.RouteID = &rid
	}
	return o
}

func toNullTimeFromString(s *string) sql.NullTime {
	if s == nil || strings.TrimSpace(*s) == "" {
		return sql.NullTime{}
	}
	t, err := time.Parse("2006-01-02", strings.TrimSpace(*s))
	if err != nil {
		t, err = time.Parse(time.RFC3339, strings.TrimSpace(*s))
		if err != nil {
			return sql.NullTime{}
		}
	}
	return sql.NullTime{Time: t, Valid: true}
}

func toNullStringFromFloat64(f *float64) sql.NullString {
	if f == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: fmt.Sprintf("%.2f", *f), Valid: true}
}
