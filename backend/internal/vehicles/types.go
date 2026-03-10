package vehicles

import "time"

type Vehicle struct {
	ID               int64      `json:"id"`
	VIN              string     `json:"vin"`
	PlateNumber      *string    `json:"plate_number,omitempty"`
	Brand            *string    `json:"brand,omitempty"`
	Model            *string    `json:"model,omitempty"`
	ProductionYear   *int16     `json:"production_year,omitempty"`
	CapacityKg       *int32     `json:"capacity_kg,omitempty"`
	CurrentMileageKm *int32     `json:"current_mileage_km,omitempty"`
	Status           string     `json:"status"`
	DeletedAt        *time.Time `json:"deleted_at,omitempty"`
	CreatedAt        *time.Time `json:"created_at,omitempty"`
	UpdatedAt        *time.Time `json:"updated_at,omitempty"`
}

type ListVehiclesQuery struct {
	Status         string
	Search         string
	IncludeDeleted bool
	Page           int32
	Limit          int32
}

type ListVehiclesResponse struct {
	Data  []Vehicle `json:"data"`
	Page  int32     `json:"page"`
	Limit int32     `json:"limit"`
	Total int64     `json:"total"`
}

type CreateVehicleRequest struct {
	VIN              string  `json:"vin"`
	PlateNumber      *string `json:"plate_number,omitempty"`
	Brand            *string `json:"brand,omitempty"`
	Model            *string `json:"model,omitempty"`
	ProductionYear   *int16  `json:"production_year,omitempty"`
	CapacityKg       *int32  `json:"capacity_kg,omitempty"`
	CurrentMileageKm *int32  `json:"current_mileage_km,omitempty"`
	Status           string  `json:"status,omitempty"`
}

type UpdateVehicleRequest struct {
	VIN              string  `json:"vin"`
	PlateNumber      *string `json:"plate_number,omitempty"`
	Brand            *string `json:"brand,omitempty"`
	Model            *string `json:"model,omitempty"`
	ProductionYear   *int16  `json:"production_year,omitempty"`
	CapacityKg       *int32  `json:"capacity_kg,omitempty"`
	CurrentMileageKm *int32  `json:"current_mileage_km,omitempty"`
	Status           string  `json:"status"`
}

type UpdateVehicleStatusRequest struct {
	Status string `json:"status"`
}

type VehicleAvailabilityResponse struct {
	VehicleID int64   `json:"vehicle_id"`
	Available bool    `json:"available"`
	Reason    *string `json:"reason,omitempty"`
	Status    string  `json:"status"`
}

type VehicleTripInfo struct {
	TripID int64
	Status string
	Start  time.Time
	End    *time.Time
}
