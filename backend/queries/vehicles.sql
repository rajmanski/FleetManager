-- name: ListVehicles :many
SELECT
  vehicle_id,
  vin,
  plate_number,
  brand,
  model,
  production_year,
  capacity_kg,
  current_mileage_km,
  status,
  deleted_at,
  created_at,
  updated_at
FROM Vehicles
WHERE (? = 1 OR deleted_at IS NULL)
  AND (? = '' OR LOWER(vin) LIKE CONCAT('%', LOWER(?), '%') OR LOWER(brand) LIKE CONCAT('%', LOWER(?), '%'))
  AND (? = '' OR status = ?)
ORDER BY vehicle_id DESC
LIMIT ? OFFSET ?;

-- name: CountVehicles :one
SELECT COUNT(*)
FROM Vehicles
WHERE (? = 1 OR deleted_at IS NULL)
  AND (? = '' OR LOWER(vin) LIKE CONCAT('%', LOWER(?), '%') OR LOWER(brand) LIKE CONCAT('%', LOWER(?), '%'))
  AND (? = '' OR status = ?);

-- name: GetVehicleByID :one
SELECT
  vehicle_id,
  vin,
  plate_number,
  brand,
  model,
  production_year,
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
  production_year,
  capacity_kg,
  current_mileage_km,
  status
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- name: UpdateVehicle :execrows
UPDATE Vehicles
SET
  vin = ?,
  plate_number = ?,
  brand = ?,
  model = ?,
  production_year = ?,
  capacity_kg = ?,
  current_mileage_km = ?,
  status = ?,
  updated_at = NOW()
WHERE vehicle_id = ?
  AND deleted_at IS NULL;

-- name: UpdateVehicleStatus :execrows
UPDATE Vehicles
SET
  status = ?,
  updated_at = NOW()
WHERE vehicle_id = ?
  AND deleted_at IS NULL;

-- name: SoftDeleteVehicle :execrows
UPDATE Vehicles
SET deleted_at = NOW(), updated_at = NOW()
WHERE vehicle_id = ?
  AND deleted_at IS NULL;

-- name: HasActiveTripsByVehicleID :one
SELECT EXISTS(
  SELECT 1
  FROM Trips
  WHERE vehicle_id = ?
    AND status IN ('Active', 'Scheduled')
);

-- name: GetDeletedVehicleVINByID :one
SELECT vin
FROM Vehicles
WHERE vehicle_id = ?
  AND deleted_at IS NOT NULL
LIMIT 1;

-- name: HasActiveVehicleWithVINExcludingID :one
SELECT EXISTS(
  SELECT 1
  FROM Vehicles
  WHERE vin = ?
    AND deleted_at IS NULL
    AND vehicle_id <> ?
);

-- name: RestoreVehicleByID :execrows
UPDATE Vehicles
SET deleted_at = NULL, updated_at = NOW()
WHERE vehicle_id = ?
  AND deleted_at IS NOT NULL;

-- name: GetVehicleTripInRange :one
SELECT
  trip_id,
  status,
  start_time,
  end_time
FROM Trips
WHERE vehicle_id = ?
  AND status IN ('Scheduled', 'Active')
  AND (
    (start_time BETWEEN ? AND ?)
    OR (end_time IS NOT NULL AND end_time BETWEEN ? AND ?)
    OR (start_time <= ? AND (end_time IS NULL OR end_time >= ?))
  )
ORDER BY start_time
LIMIT 1;

-- name: ListVehicleMaintenanceHistory :many
SELECT
  maintenance_id,
  type,
  status,
  start_date,
  end_date,
  parts_cost_pln,
  labor_cost_pln,
  total_cost_pln,
  description
FROM Maintenance
WHERE vehicle_id = ?
  AND (? = '' OR type = ?)
  AND (? = '' OR status = ?)
ORDER BY COALESCE(end_date, start_date, created_at) DESC, maintenance_id DESC;
