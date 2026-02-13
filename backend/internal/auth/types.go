package auth

import "time"

type LoginRequest struct {
	Login    string `json:"login"`
	Password string `json:"password"`
}

type LoginUser struct {
	ID    int64  `json:"id"`
	Login string `json:"login"`
	Role  string `json:"role"`
}

type LoginResponse struct {
	Token string    `json:"token"`
	User  LoginUser `json:"user"`
}

type User struct {
	ID                 int64
	Login              string
	Role               string
	PasswordHash       string
	FailedLoginAttempt int
	LockedUntil        *time.Time
}
