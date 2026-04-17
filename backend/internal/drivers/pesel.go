package drivers

import "strings"

func LooksLikePESEL(s string) bool {
	t := strings.TrimSpace(s)
	if len(t) < 1 || len(t) > 11 {
		return false
	}
	for i := 0; i < len(t); i++ {
		if t[i] < '0' || t[i] > '9' {
			return false
		}
	}
	return true
}

func IsValidPESEL(pesel string) bool {
	s := strings.TrimSpace(pesel)
	if len(s) != 11 {
		return false
	}

	for i := 0; i < 11; i++ {
		if s[i] < '0' || s[i] > '9' {
			return false
		}
	}
	return true
}

func ValidatePESEL(pesel string) error {
	if !IsValidPESEL(pesel) {
		return ErrInvalidPESEL
	}
	return nil
}
