package trips

import (
	"errors"
	"fmt"
)

var (
	ErrCargoExceedsCapacity = errors.New("cargo exceeds vehicle capacity")
)

type CargoExceedsCapacityError struct {
	TotalWeightKg float64
	CapacityKg    int32
}

func (e *CargoExceedsCapacityError) Error() string {
	return fmt.Sprintf("total cargo weight (%.2f kg) exceeds vehicle capacity (%d kg)", e.TotalWeightKg, e.CapacityKg)
}

func (e *CargoExceedsCapacityError) Is(target error) bool {
	return target == ErrCargoExceedsCapacity
}

func NewCargoExceedsCapacityError(totalWeightKg float64, capacityKg int32) error {
	return &CargoExceedsCapacityError{TotalWeightKg: totalWeightKg, CapacityKg: capacityKg}
}

func IsCargoExceedsCapacity(err error) bool {
	return errors.Is(err, ErrCargoExceedsCapacity)
}
