package trips

import (
	"context"

	"fleet-management/internal/cargo"
	"fleet-management/internal/vehicles"
)

func ValidateCargoFitsVehicle(
	ctx context.Context,
	cargoRepo cargo.Repository,
	vehicleRepo vehicles.Repository,
	orderID, vehicleID int64,
) error {
	if orderID <= 0 || vehicleID <= 0 {
		return nil
	}

	totalWeight, err := cargoRepo.SumCargoWeightByOrderID(ctx, orderID)
	if err != nil {
		return err
	}

	vehicle, err := vehicleRepo.GetVehicleByID(ctx, vehicleID)
	if err != nil {
		return err
	}

	if vehicle.CapacityKg == nil || *vehicle.CapacityKg <= 0 {
		return nil
	}

	capacity := *vehicle.CapacityKg
	if totalWeight > float64(capacity) {
		return NewCargoExceedsCapacityError(totalWeight, capacity)
	}

	return nil
}
