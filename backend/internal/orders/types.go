package orders

import "time"

type Order struct {
	ID               int64      `json:"id"`
	ClientID         int64      `json:"clientId"`
	OrderNumber      string     `json:"orderNumber"`
	CreationDate     *time.Time `json:"creationDate,omitempty"`
	DeliveryDeadline *time.Time `json:"deliveryDeadline,omitempty"`
	TotalPricePln    *float64   `json:"totalPricePln,omitempty"`
	Status           string     `json:"status"`
	ClientCompany    string     `json:"clientCompany,omitempty"`
	CargoTypes       string     `json:"cargoTypes,omitempty"`
	RouteID          *int64     `json:"routeId,omitempty"`
}

type ListOrdersQuery struct {
	StatusFilter string
	Search       string
	Page         int32
	Limit        int32
}

type ListOrdersResponse struct {
	Data  []Order `json:"data"`
	Page  int32   `json:"page"`
	Limit int32   `json:"limit"`
	Total int64   `json:"total"`
}

type CreateOrderRequest struct {
	ClientID         int64    `json:"clientId" binding:"required"`
	OrderNumber      string   `json:"orderNumber" binding:"required"`
	DeliveryDeadline *string  `json:"deliveryDeadline,omitempty"`
	TotalPricePln    *float64 `json:"totalPricePln,omitempty"`
	Status           *string  `json:"status,omitempty"`
}

type UpdateOrderRequest struct {
	ClientID         int64    `json:"clientId" binding:"required"`
	OrderNumber      string   `json:"orderNumber" binding:"required"`
	DeliveryDeadline *string  `json:"deliveryDeadline,omitempty"`
	TotalPricePln    *float64 `json:"totalPricePln,omitempty"`
	Status           *string  `json:"status,omitempty"`
}
