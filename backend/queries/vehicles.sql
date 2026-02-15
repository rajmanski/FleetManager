-- name: ListVehicles :many
SELECT
  vehicle_id,
  vin,
  plate_number,
  brand,
  model,
  capacity_kg,
  current_mileage_km,
  status,
  created_at,
  updated_at
FROM Vehicles
WHERE deleted_at IS NULL
  AND (? = '' OR status = ?)
ORDER BY vehicle_id DESC
LIMIT ? OFFSET ?;

-- name: CountVehicles :one
SELECT COUNT(*)
FROM Vehicles
WHERE deleted_at IS NULL
  AND (? = '' OR status = ?);

-- name: GetVehicleByID :one
SELECT
  vehicle_id,
  vin,
  plate_number,
  brand,
  model,
  capacity_kg,
  current_mileage_km,
  status,
  created_at,
  updated_at
FROM Vehicles
WHERE vehicle_id = ?
  AND deleted_at IS NULL
LIMIT 1;

-- name: CreateVehicle :execlastid
INSERT INTO Vehicles (
  vin,
  plate_number,
  brand,
  model,
  capacity_kg,
  current_mileage_km,
  status
)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: UpdateVehicle :execrows
UPDATE Vehicles
SET
  vin = ?,
  plate_number = ?,
  brand = ?,
  model = ?,
  capacity_kg = ?,
  current_mileage_km = ?,
  status = ?,
  updated_at = NOW()
WHERE vehicle_id = ?
  AND deleted_at IS NULL;

-- name: SoftDeleteVehicle :execrows
UPDATE Vehicles
SET deleted_at = NOW(), updated_at = NOW()
WHERE vehicle_id = ?
  AND deleted_at IS NULL;
