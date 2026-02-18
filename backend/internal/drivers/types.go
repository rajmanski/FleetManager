package drivers

import "time"

type Driver struct {
	ID        int64      `json:"id"`
	UserID    *int32     `json:"user_id,omitempty"`
	FirstName string     `json:"first_name"`
	LastName  string     `json:"last_name"`
	PESEL     string     `json:"pesel"`
	Phone     *string    `json:"phone,omitempty"`
	Email     *string    `json:"email,omitempty"`
	Status    string     `json:"status"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

type ListDriversQuery struct {
	Status         string
	Search         string
	IncludeDeleted bool
	Page           int32
	Limit          int32
}

type ListDriversResponse struct {
	Data  []Driver `json:"data"`
	Page  int32    `json:"page"`
	Limit int32    `json:"limit"`
	Total int64    `json:"total"`
}

type CreateDriverRequest struct {
	UserID    *int32  `json:"user_id,omitempty"`
	FirstName string  `json:"first_name"`
	LastName  string  `json:"last_name"`
	PESEL     string  `json:"pesel"`
	Phone     *string `json:"phone,omitempty"`
	Email     *string `json:"email,omitempty"`
	Status    string  `json:"status,omitempty"`
}

type UpdateDriverRequest struct {
	UserID    *int32  `json:"user_id,omitempty"`
	FirstName string  `json:"first_name"`
	LastName  string  `json:"last_name"`
	PESEL     string  `json:"pesel"`
	Phone     *string `json:"phone,omitempty"`
	Email     *string `json:"email,omitempty"`
	Status    string  `json:"status"`
}
