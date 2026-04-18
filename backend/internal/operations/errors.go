package operations

import "strings"

type FieldError struct {
	Field   string `json:"field"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

type ValidationError struct {
	Message      string       `json:"message"`
	FieldErrors  []FieldError `json:"field_errors,omitempty"`
	GlobalErrors []FieldError `json:"global_errors,omitempty"`
}

func (e *ValidationError) Error() string {
	if e == nil {
		return ""
	}
	if strings.TrimSpace(e.Message) != "" {
		return e.Message
	}
	return "workflow validation failed"
}

func (e *ValidationError) hasErrors() bool {
	return len(e.FieldErrors) > 0 || len(e.GlobalErrors) > 0
}

func (e *ValidationError) HasCode(code string) bool {
	if e == nil || strings.TrimSpace(code) == "" {
		return false
	}

	for _, fieldErr := range e.FieldErrors {
		if fieldErr.Code == code {
			return true
		}
	}
	for _, globalErr := range e.GlobalErrors {
		if globalErr.Code == code {
			return true
		}
	}
	return false
}
