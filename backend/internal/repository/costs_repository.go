package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"fleet-management/internal/costs"
	sqlc "fleet-management/internal/db/sqlc"
)

type CostsRepository struct {
	queries sqlc.Querier
}

func NewCostsRepository(queries sqlc.Querier) *CostsRepository {
	return &CostsRepository{queries: queries}
}

func (r *CostsRepository) ListCosts(ctx context.Context, query costs.ListCostsQuery) ([]costs.Cost, int64, error) {
	offset := (query.Page - 1) * query.Limit

	vehicleFilter := interface{}(0)
	vehicleID := int32(0)
	if query.VehicleID > 0 {
		vehicleFilter = 1
		vehicleID = int32(query.VehicleID)
	}

	categoryColumnValue := interface{}("")
	categoryEnum := sqlc.CostCategory("Tolls")
	if strings.TrimSpace(query.Category) != "" {
		categoryEnum = sqlc.CostCategory(strings.TrimSpace(query.Category))
		categoryColumnValue = strings.TrimSpace(query.Category)
	}

	rows, err := r.queries.ListCost(ctx, sqlc.ListCostParams{
		Column1:   vehicleFilter,
		VehicleID: vehicleID,
		Column3:   categoryColumnValue,
		Category:  categoryEnum,
		Limit:     query.Limit,
		Offset:    offset,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.CountCost(ctx, sqlc.CountCostParams{
		Column1:   vehicleFilter,
		VehicleID: vehicleID,
		Column3:   categoryColumnValue,
		Category:  categoryEnum,
	})
	if err != nil {
		return nil, 0, err
	}

	out := make([]costs.Cost, 0, len(rows))
	for _, row := range rows {
		out = append(out, mapCostRow(row))
	}
	return out, total, nil
}

func (r *CostsRepository) GetCostByID(ctx context.Context, id int64) (costs.Cost, error) {
	row, err := r.queries.GetCostByID(ctx, int32(id))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return costs.Cost{}, costs.ErrCostNotFound
		}
		return costs.Cost{}, err
	}
	return mapCostRow(row), nil
}

func (r *CostsRepository) CreateCost(ctx context.Context, input costs.CreateCostRequest) (int64, error) {
	date, err := time.Parse("2006-01-02", strings.TrimSpace(input.Date))
	if err != nil {
		return 0, costs.ErrInvalidInput
	}

	return r.queries.CreateCost(ctx, sqlc.CreateCostParams{
		VehicleID:     int32(input.VehicleID),
		Category:      sqlc.CostCategory(strings.TrimSpace(input.Category)),
		Amount:        fmt.Sprintf("%.2f", input.Amount),
		Date:          date,
		Description:   toNullStringFromValue(input.Description),
		InvoiceNumber: toNullStringFromValue(input.InvoiceNumber),
	})
}

func (r *CostsRepository) UpdateCost(ctx context.Context, id int64, input costs.UpdateCostRequest) error {
	date, err := time.Parse("2006-01-02", strings.TrimSpace(input.Date))
	if err != nil {
		return costs.ErrInvalidInput
	}

	rows, err := r.queries.UpdateCost(ctx, sqlc.UpdateCostParams{
		VehicleID:     int32(input.VehicleID),
		Category:      sqlc.CostCategory(strings.TrimSpace(input.Category)),
		Amount:        fmt.Sprintf("%.2f", input.Amount),
		Date:          date,
		Description:   toNullStringFromValue(input.Description),
		InvoiceNumber: toNullStringFromValue(input.InvoiceNumber),
		ID:            int32(id),
	})
	if err != nil {
		return err
	}
	if rows == 0 {
		return costs.ErrCostNotFound
	}
	return nil
}

func (r *CostsRepository) DeleteCost(ctx context.Context, id int64) error {
	rows, err := r.queries.DeleteCost(ctx, int32(id))
	if err != nil {
		return err
	}
	if rows == 0 {
		return costs.ErrCostNotFound
	}
	return nil
}

func mapCostRow(row sqlc.Cost) costs.Cost {
	var amount float64
	_, _ = fmt.Sscanf(row.Amount, "%f", &amount)

	var createdAt *time.Time
	if row.CreatedAt.Valid {
		t := row.CreatedAt.Time
		createdAt = &t
	}

	return costs.Cost{
		ID:            int64(row.ID),
		VehicleID:     int64(row.VehicleID),
		Category:      string(row.Category),
		Amount:        amount,
		Date:          row.Date,
		Description:   nullStringToPtr(row.Description),
		InvoiceNumber: nullStringToPtr(row.InvoiceNumber),
		CreatedAt:     createdAt,
	}
}


var _ costs.Repository = (*CostsRepository)(nil)
