-- name: GetVehicleCurrentMileage :one
SELECT current_mileage_km
FROM Vehicles
WHERE vehicle_id = ?
  AND deleted_at IS NULL
LIMIT 1;

-- name: UpdateVehicleMileage :execrows
UPDATE Vehicles
SET
  current_mileage_km = ?,
  updated_at = NOW()
WHERE vehicle_id = ?
  AND deleted_at IS NULL;

-- name: CreateFuelLog :execlastid
INSERT INTO FuelLog (
  vehicle_id,
  date,
  liters,
  price_per_liter,
  total_cost,
  mileage,
  location
)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: GetAvgFuelConsumptionPer100Km :one
-- Avg current consumption across entire fuel history (norm).
-- Uses LAG to get previous mileage per log; excludes first log (prev is NULL) and non-positive deltas.
SELECT
  AVG(
    CASE
      WHEN prev_mileage IS NULL OR (mileage - prev_mileage) <= 0 THEN NULL
      ELSE (CAST(liters AS DOUBLE) / (mileage - prev_mileage)) * 100
    END
  ) AS avg_consumption_per_100km
FROM (
  SELECT
    liters,
    mileage,
    LAG(mileage) OVER (PARTITION BY vehicle_id ORDER BY date, id) AS prev_mileage
  FROM FuelLog
  WHERE vehicle_id = ?
) AS x;

-- name: ListFuelLog :many
WITH annotated AS (
  SELECT
    FuelLog.*,
    LAG(FuelLog.mileage) OVER (
      PARTITION BY FuelLog.vehicle_id
      ORDER BY FuelLog.date, FuelLog.id
    ) AS prev_mileage,
    EXISTS(
      SELECT 1
      FROM Alerts a
      WHERE a.fuel_log_id = FuelLog.id
        AND a.alert_type = 'fuel_anomaly'
    ) AS has_alert
  FROM FuelLog
  WHERE (? = 0 OR FuelLog.vehicle_id = ?)
),
computed AS (
  SELECT
    annotated.*,
    CASE
      WHEN annotated.prev_mileage IS NULL OR (annotated.mileage - annotated.prev_mileage) <= 0 THEN NULL
      ELSE (CAST(annotated.liters AS DOUBLE) / (annotated.mileage - annotated.prev_mileage)) * 100
    END AS consumption_per_100km_raw,
    AVG(
      CASE
        WHEN annotated.prev_mileage IS NULL OR (annotated.mileage - annotated.prev_mileage) <= 0 THEN NULL
        ELSE (CAST(annotated.liters AS DOUBLE) / (annotated.mileage - annotated.prev_mileage)) * 100
      END
    ) OVER (PARTITION BY annotated.vehicle_id) AS avg_consumption_per_100km_raw
  FROM annotated
)
SELECT
  id,
  vehicle_id,
  date,
  liters,
  price_per_liter,
  total_cost,
  mileage,
  location,
  created_at,
  has_alert,
  has_alert AS is_anomaly,
  ROUND(COALESCE(consumption_per_100km_raw, 0), 1) AS consumption_per_100km,
  ROUND(COALESCE(avg_consumption_per_100km_raw, 0), 1) AS avg_consumption_per_100km,
  ROUND(
    CASE
      WHEN consumption_per_100km_raw IS NULL
        OR avg_consumption_per_100km_raw IS NULL
        OR avg_consumption_per_100km_raw <= 0
      THEN 0
      ELSE ABS(consumption_per_100km_raw - avg_consumption_per_100km_raw) / avg_consumption_per_100km_raw * 100
    END,
    1
  ) AS deviation_percent
FROM computed
WHERE (? = '' OR date >= ?)
  AND (? = '' OR date <= ?)
ORDER BY id DESC
LIMIT ? OFFSET ?;

-- name: CountFuelLog :one
SELECT COUNT(*)
FROM FuelLog
WHERE (? = 0 OR vehicle_id = ?)
  AND (? = '' OR date >= ?)
  AND (? = '' OR date <= ?);

