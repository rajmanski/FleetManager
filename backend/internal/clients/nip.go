package clients

import "unicode"

func ValidateNIP(nip string) (bool, error) {
	if len(nip) != 10 {
		return false, ErrInvalidInput
	}

	digits := make([]int, 10)
	for i, r := range nip {
		if !unicode.IsDigit(r) {
			return false, ErrInvalidInput
		}
		digits[i] = int(r - '0')
	}

	weights := []int{6, 5, 7, 2, 3, 4, 5, 6, 7}
	sum := 0
	for i := 0; i < 9; i++ {
		sum += digits[i] * weights[i]
	}
	checksum := sum % 11

	if checksum == 10 {
		return false, nil
	}

	return digits[9] == checksum, nil
}

