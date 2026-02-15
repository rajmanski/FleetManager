package vehicles

import (
	"errors"
	"testing"
)

func TestIsValidVIN(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		vin  string
		want bool
	}{
		{
			name: "valid VIN with numeric check digit",
			vin:  "1HGCM82633A004352",
			want: true,
		},
		{
			name: "valid VIN with X check digit",
			vin:  "1M8GDM9AXKP042788",
			want: true,
		},
		{
			name: "valid VIN with lowercase input",
			vin:  "1hgcm82633a004352",
			want: true,
		},
		{
			name: "invalid VIN length",
			vin:  "1HGCM82633A00435",
			want: false,
		},
		{
			name: "invalid VIN checksum",
			vin:  "1HGCM82633A004353",
			want: false,
		},
		{
			name: "invalid VIN contains disallowed character I",
			vin:  "1HGIM82633A004352",
			want: false,
		},
		{
			name: "invalid VIN contains disallowed character O",
			vin:  "1HGOM82633A004352",
			want: false,
		},
		{
			name: "invalid VIN contains disallowed character Q",
			vin:  "1HGQM82633A004352",
			want: false,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			got := IsValidVIN(tt.vin)
			if got != tt.want {
				t.Fatalf("IsValidVIN(%q) = %v, want %v", tt.vin, got, tt.want)
			}
		})
	}
}

func TestValidateVINForCreateAndUpdate(t *testing.T) {
	t.Parallel()

	if err := ValidateVINForCreate("1HGCM82633A004352"); err != nil {
		t.Fatalf("ValidateVINForCreate() unexpected error: %v", err)
	}
	if err := ValidateVINForUpdate("1M8GDM9AXKP042788"); err != nil {
		t.Fatalf("ValidateVINForUpdate() unexpected error: %v", err)
	}

	if err := ValidateVINForCreate("INVALID-VIN"); !errors.Is(err, ErrInvalidVIN) {
		t.Fatalf("ValidateVINForCreate() expected ErrInvalidVIN, got: %v", err)
	}
	if err := ValidateVINForUpdate("123"); !errors.Is(err, ErrInvalidVIN) {
		t.Fatalf("ValidateVINForUpdate() expected ErrInvalidVIN, got: %v", err)
	}
}
