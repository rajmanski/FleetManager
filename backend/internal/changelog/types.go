package changelog

import (
	"encoding/json"
	"time"
)

type Entry struct {
	ID        int32           `json:"id"`
	UserID    *int32          `json:"userId,omitempty"`
	TableName string          `json:"tableName"`
	RecordID  int32           `json:"recordId"`
	Operation string          `json:"operation"`
	OldData   json.RawMessage `json:"oldData,omitempty"`
	NewData   json.RawMessage `json:"newData,omitempty"`
	Timestamp *time.Time      `json:"timestamp,omitempty"`
}

type ListChangelogQuery struct {
	UserID     int64
	TableName  string
	Operation  string
	DateFrom   *time.Time
	DateTo     *time.Time
	Page       int32
	Limit      int32
}

type ListChangelogResponse struct {
	Data  []Entry `json:"data"`
	Page  int32   `json:"page"`
	Limit int32   `json:"limit"`
	Total int64   `json:"total"`
}
