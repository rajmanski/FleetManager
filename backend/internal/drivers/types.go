package drivers

import "time"

type Driver struct {
	ID                int64      `json:"id"`
	UserID            *int32     `json:"user_id,omitempty"`
	FirstName         string     `json:"first_name"`
	LastName          string     `json:"last_name"`
	PESEL             string     `json:"pesel"`
	Phone             *string    `json:"phone,omitempty"`
	Email             *string    `json:"email,omitempty"`
	Status            string     `json:"status"`
	LicenseNumber     *string    `json:"license_number,omitempty"`
	LicenseExpiryDate *time.Time `json:"license_expiry_date,omitempty"`
	ADRCertified      bool       `json:"adr_certified"`
	ADRExpiryDate     *time.Time `json:"adr_expiry_date,omitempty"`
	DeletedAt         *time.Time `json:"deleted_at,omitempty"`
	CreatedAt         *time.Time `json:"created_at,omitempty"`
	UpdatedAt         *time.Time `json:"updated_at,omitempty"`
}

type ListDriversQuery struct {
	Status         string
	Search         string
	IncludeDeleted bool
	Page           int32
	Limit          int32
}

type ListDriversResponse struct {
	Data  []Driver `json:"data"`
	Page  int32    `json:"page"`
	Limit int32    `json:"limit"`
	Total int64    `json:"total"`
}

type CreateDriverRequest struct {
	UserID    *int32  `json:"user_id,omitempty"`
	FirstName string  `json:"first_name"`
	LastName  string  `json:"last_name"`
	PESEL     string  `json:"pesel"`
	Phone     *string `json:"phone,omitempty"`
	Email     *string `json:"email,omitempty"`
	Status    string  `json:"status,omitempty"`
}

type UpdateDriverRequest struct {
	UserID            *int32     `json:"user_id,omitempty"`
	FirstName         string     `json:"first_name"`
	LastName          string     `json:"last_name"`
	PESEL             string     `json:"pesel"`
	Phone             *string    `json:"phone,omitempty"`
	Email             *string    `json:"email,omitempty"`
	Status            string     `json:"status"`
	LicenseNumber     *string    `json:"license_number,omitempty"`
	LicenseExpiryDate *time.Time `json:"license_expiry_date,omitempty"`
	ADRCertified      *bool      `json:"adr_certified,omitempty"`
	ADRExpiryDate     *time.Time `json:"adr_expiry_date,omitempty"`
}

type DriverCurrentAssignment struct {
	VehicleID  int64  `json:"vehicle_id"`
	VehicleVIN string `json:"vehicle_vin"`
}

type DriverAvailabilityResponse struct {
	DriverID          int64                   `json:"driver_id"`
	Date              string                  `json:"date,omitempty"`
	Available         bool                    `json:"available"`
	Reason            *string                 `json:"reason,omitempty"`
	CurrentAssignment *DriverCurrentAssignment `json:"current_assignment,omitempty"`
}

type CanTransportHazardousResponse struct {
	CanTransport bool   `json:"can_transport"`
	Reason       string `json:"reason,omitempty"`
}
