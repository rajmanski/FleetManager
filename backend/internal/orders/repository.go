package orders

import "context"

type Repository interface {
	ListOrders(ctx context.Context, query ListOrdersQuery) ([]Order, int64, error)
	GetOrderByID(ctx context.Context, orderID int64) (Order, error)
	CreateOrder(ctx context.Context, input CreateOrderRequest) (int64, error)
	UpdateOrder(ctx context.Context, orderID int64, input UpdateOrderRequest) error
	CancelOrder(ctx context.Context, orderID int64) error
}
