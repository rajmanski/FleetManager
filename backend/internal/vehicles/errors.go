package vehicles

import "errors"

var ErrInvalidInput = errors.New("invalid input")
var ErrInvalidVIN = errors.New("invalid vin")
var ErrVehicleNotFound = errors.New("vehicle not found")
var ErrVehicleVINConflict = errors.New("vehicle vin conflict")
var ErrInvalidStatus = errors.New("invalid status")
