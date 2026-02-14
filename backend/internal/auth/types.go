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
	Token        string    `json:"token"`
	User         LoginUser `json:"user"`
	RefreshToken string    `json:"-"`
}

type RefreshResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int64  `json:"expires_in"`
}

type User struct {
	ID                 int64
	Login              string
	Role               string
	PasswordHash       string
	FailedLoginAttempt int
	LockedUntil        *time.Time
}
