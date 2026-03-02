package clients

import "time"

type Client struct {
	ID           int64      `json:"id"`
	CompanyName  string     `json:"companyName"`
	NIP          string     `json:"nip"`
	Address      *string    `json:"address,omitempty"`
	ContactEmail *string    `json:"contactEmail,omitempty"`
	DeletedAt    *time.Time `json:"deletedAt,omitempty"`
	CreatedAt    *time.Time `json:"createdAt,omitempty"`
}

type ListClientsQuery struct {
	Search         string
	IncludeDeleted bool
	Page           int32
	Limit          int32
}

type ListClientsResponse struct {
	Data  []Client `json:"data"`
	Page  int32    `json:"page"`
	Limit int32    `json:"limit"`
	Total int64    `json:"total"`
}

type CreateClientRequest struct {
	CompanyName  string  `json:"companyName" binding:"required"`
	NIP          string  `json:"nip" binding:"required"`
	Address      *string `json:"address,omitempty"`
	ContactEmail *string `json:"contactEmail,omitempty"`
}

type UpdateClientRequest struct {
	CompanyName  string  `json:"companyName" binding:"required"`
	NIP          string  `json:"nip" binding:"required"`
	Address      *string `json:"address,omitempty"`
	ContactEmail *string `json:"contactEmail,omitempty"`
}

