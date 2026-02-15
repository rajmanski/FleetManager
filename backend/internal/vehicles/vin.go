package vehicles

import "strings"

var vinWeights = [17]int{8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2}

func IsValidVIN(vin string) bool {
	normalizedVIN := strings.ToUpper(strings.TrimSpace(vin))
	if len(normalizedVIN) != 17 {
		return false
	}

	sum := 0
	for i := 0; i < len(normalizedVIN); i++ {
		value, ok := transliteratedVINValue(normalizedVIN[i])
		if !ok {
			return false
		}
		sum += value * vinWeights[i]
	}

	remainder := sum % 11
	checkDigit := normalizedVIN[8]
	if remainder == 10 {
		return checkDigit == 'X'
	}
	return checkDigit == byte('0'+remainder)
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

func transliteratedVINValue(ch byte) (int, bool) {
	switch ch {
	case 'A', 'J':
		return 1, true
	case 'B', 'K', 'S':
		return 2, true
	case 'C', 'L', 'T':
		return 3, true
	case 'D', 'M', 'U':
		return 4, true
	case 'E', 'N', 'V':
		return 5, true
	case 'F', 'W':
		return 6, true
	case 'G', 'P', 'X':
		return 7, true
	case 'H', 'Y':
		return 8, true
	case 'R', 'Z':
		return 9, true
	case 'I', 'O', 'Q':
		return 0, false
	default:
		if ch >= '0' && ch <= '9' {
			return int(ch - '0'), true
		}
		return 0, false
	}
}
