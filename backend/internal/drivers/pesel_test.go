package drivers

import "testing"

func TestLooksLikePESEL(t *testing.T) {
	tests := []struct {
		s     string
		valid bool
	}{
		{"44051401359", true},
		{" 44051401359 ", true},
		{"12345678901", true},
		{"1234567890", true},
		{"98", true},
		{"123456789012", false},
		{"4405140135X", false},
		{"", false},
	}
	for _, tt := range tests {
		if got := LooksLikePESEL(tt.s); got != tt.valid {
			t.Errorf("LooksLikePESEL(%q) = %v, want %v", tt.s, got, tt.valid)
		}
	}
}

func TestIsValidPESEL(t *testing.T) {
	tests := []struct {
		name   string
		pesel  string
		valid  bool
	}{
		{"valid 1", "44051401359", true},
		{"valid 2", "90090515836", true},
		{"valid 3", "02070803628", true},
		{"digits only no checksum", "44051401358", true},
		{"invalid length short", "4405140135", false},
		{"invalid length long", "440514013599", false},
		{"invalid char", "4405140135X", false},
		{"empty", "", false},
		{"with spaces", " 44051401359 ", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsValidPESEL(tt.pesel); got != tt.valid {
				t.Errorf("IsValidPESEL(%q) = %v, want %v", tt.pesel, got, tt.valid)
			}
		})
	}
}
