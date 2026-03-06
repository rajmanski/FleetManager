package cargo

import (
	"context"

	"fleet-management/internal/orders"
)

type orderStatusChecker struct {
	repo orders.Repository
}

func NewOrderStatusChecker(repo orders.Repository) *orderStatusChecker {
	return &orderStatusChecker{repo: repo}
}

func (o *orderStatusChecker) GetOrderStatus(ctx context.Context, orderID int64) (string, error) {
	order, err := o.repo.GetOrderByID(ctx, orderID)
	if err != nil {
		return "", err
	}
	return order.Status, nil
}
