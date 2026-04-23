package vehicles

import "strings"

func IsValidVIN(vin string) bool {
	normalizedVIN := strings.ToUpper(strings.TrimSpace(vin))
	if len(normalizedVIN) != 17 {
		return false
	}

	for i := 0; i < len(normalizedVIN); i++ {
		if !isAllowedVINChar(normalizedVIN[i]) {
			return false
		}
	}
	return true
}

func ValidateVINForCreate(vin string) error {
	if !IsValidVIN(vin) {
		return ErrInvalidVIN
	}
	return nil
}

func ValidateVINForUpdate(vin string) error {
	if !IsValidVIN(vin) {
		return ErrInvalidVIN
	}
	return nil
}

func isAllowedVINChar(ch byte) bool {
	switch ch {
	case 'I', 'O', 'Q':
		return false
	default:
		return (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9')
	}
}
