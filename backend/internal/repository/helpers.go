package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/go-sql-driver/mysql"
)

func toNullString(value *string) sql.NullString {
	if value == nil {
		return sql.NullString{}
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: trimmed, Valid: true}
}

func toNullStringFromValue(s string) sql.NullString {
	trimmed := strings.TrimSpace(s)
	if trimmed == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: trimmed, Valid: true}
}

func toNullStringFromFloat64(f *float64) sql.NullString {
	if f == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: fmt.Sprintf("%.2f", *f), Valid: true}
}

func toNullInt32(value *int32) sql.NullInt32 {
	if value == nil {
		return sql.NullInt32{}
	}
	return sql.NullInt32{Int32: *value, Valid: true}
}

func toNullInt16(value *int16) sql.NullInt16 {
	if value == nil {
		return sql.NullInt16{}
	}
	return sql.NullInt16{Int16: *value, Valid: true}
}

func toNullTimeFromString(s *string) sql.NullTime {
	if s == nil || strings.TrimSpace(*s) == "" {
		return sql.NullTime{}
	}
	t, err := time.Parse("2006-01-02", strings.TrimSpace(*s))
	if err != nil {
		t, err = time.Parse(time.RFC3339, strings.TrimSpace(*s))
		if err != nil {
			return sql.NullTime{}
		}
	}
	return sql.NullTime{Time: t, Valid: true}
}

func float64OrZero(v *float64) float64 {
	if v == nil {
		return 0
	}
	return *v
}

func parseDecimalAny(value interface{}) (float64, error) {
	switch v := value.(type) {
	case float64:
		return v, nil
	case int64:
		return float64(v), nil
	case []byte:
		return strconv.ParseFloat(string(v), 64)
	case string:
		return strconv.ParseFloat(v, 64)
	default:
		var parsed float64
		_, err := fmt.Sscanf(fmt.Sprint(v), "%f", &parsed)
		if err != nil {
			return 0, err
		}
		return parsed, nil
	}
}

func nullStringToPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	v := value.String
	return &v
}

func isDuplicateEntryError(err error) bool {
	var mysqlErr *mysql.MySQLError
	return errors.As(err, &mysqlErr) && mysqlErr.Number == 1062
}

func isTableNotFoundError(err error) bool {
	var mysqlErr *mysql.MySQLError
	return errors.As(err, &mysqlErr) && mysqlErr.Number == 1146
}
