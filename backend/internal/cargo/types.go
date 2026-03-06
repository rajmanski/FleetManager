package cargo

type Cargo struct {
	ID          int64   `json:"id"`
	OrderID     int64   `json:"orderId"`
	Description string  `json:"description,omitempty"`
	WeightKg    float64 `json:"weightKg,omitempty"`
	VolumeM3    float64 `json:"volumeM3,omitempty"`
	CargoType   string  `json:"cargoType"`
}

type CreateCargoRequest struct {
	Description string  `json:"description"`
	WeightKg    float64 `json:"weightKg" binding:"required"`
	VolumeM3    float64 `json:"volumeM3" binding:"required"`
	CargoType   string  `json:"cargoType" binding:"required"`
}

type UpdateCargoRequest struct {
	Description string  `json:"description"`
	WeightKg    float64 `json:"weightKg" binding:"required"`
	VolumeM3    float64 `json:"volumeM3" binding:"required"`
	CargoType   string  `json:"cargoType" binding:"required"`
}
