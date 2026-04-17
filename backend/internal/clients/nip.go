package clients

import "unicode"

func ValidateNIP(nip string) (bool, error) {
	if len(nip) != 10 {
		return false, ErrInvalidInput
	}

	for _, r := range nip {
		if !unicode.IsDigit(r) {
			return false, ErrInvalidInput
		}
	}
	return true, nil
}

