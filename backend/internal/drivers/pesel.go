package drivers

import "strings"

var peselWeights = [10]int{1, 3, 7, 9, 1, 3, 7, 9, 1, 3}

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

	var digits [11]int
	for i := 0; i < 11; i++ {
		if s[i] < '0' || s[i] > '9' {
			return false
		}
		digits[i] = int(s[i] - '0')
	}

	sum := 0
	for i := 0; i < 10; i++ {
		sum += digits[i] * peselWeights[i]
	}

	checksum := 10 - (sum % 10)
	if checksum == 10 {
		checksum = 0
	}

	return digits[10] == checksum
}

func ValidatePESEL(pesel string) error {
	if !IsValidPESEL(pesel) {
		return ErrInvalidPESEL
	}
	return nil
}
