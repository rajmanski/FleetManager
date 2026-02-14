package users

import "time"

type AdminUser struct {
	ID        int64      `json:"id"`
	Login     string     `json:"login"`
	Email     string     `json:"email"`
	Role      string     `json:"role"`
	IsActive  bool       `json:"is_active"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
}

type CreateAdminUserRequest struct {
	Login    string `json:"login"`
	Password string `json:"password"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

type UpdateAdminUserRequest struct {
	Login    string  `json:"login"`
	Email    string  `json:"email"`
	Role     string  `json:"role"`
	Password *string `json:"password,omitempty"`
}
