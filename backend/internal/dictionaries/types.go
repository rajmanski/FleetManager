package dictionaries

import (
	"context"
	"time"
)

type Validator interface {
	Exists(ctx context.Context, category, key string) (bool, error)
}

type Entry struct {
	ID        int64     `json:"id"`
	Category  string    `json:"category"`
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateRequest struct {
	Category string `json:"category"`
	Key      string `json:"key"`
	Value    string `json:"value"`
}

type UpdateRequest struct {
	Category string `json:"category"`
	Key      string `json:"key"`
	Value    string `json:"value"`
}
