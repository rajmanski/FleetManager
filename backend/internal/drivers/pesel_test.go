package drivers

import "testing"

func TestIsValidPESEL(t *testing.T) {
	tests := []struct {
		name   string
		pesel  string
		valid  bool
	}{
		{"valid 1", "44051401359", true},
		{"valid 2", "90090515836", true},
		{"valid 3", "02070803628", true},
		{"invalid length short", "4405140135", false},
		{"invalid length long", "440514013599", false},
		{"invalid checksum", "44051401358", false},
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
