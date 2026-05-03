-- name: GetVehicleRevenueForMonth :one
SELECT COALESCE(SUM(o.total_price_pln), 0) AS revenue
FROM Orders o
WHERE o.order_id IN (
  SELECT DISTINCT t.order_id
  FROM Trips t
  WHERE t.vehicle_id = ?
    AND COALESCE(t.end_time, t.start_time) >= ?
    AND COALESCE(t.end_time, t.start_time) < ?
);

-- name: GetVehicleFuelCostForMonth :one
SELECT COALESCE(SUM(fl.total_cost), 0) AS fuel_cost
FROM FuelLog fl
WHERE fl.vehicle_id = ?
  AND fl.date >= ?
  AND fl.date < ?;

-- name: GetVehicleMaintenanceCostForMonth :one
SELECT COALESCE(SUM(m.total_cost_pln), 0) AS maintenance_cost
FROM Maintenance m
WHERE m.vehicle_id = ?
  AND m.start_date IS NOT NULL
  AND m.start_date >= ?
  AND m.start_date < ?;

-- name: GetVehicleInsuranceMonthlyCost :one
SELECT COALESCE(SUM(ip.cost / 12), 0) AS insurance_cost
FROM InsurancePolicy ip
WHERE ip.vehicle_id = ?
  AND ip.start_date <= ?
  AND ip.end_date >= ?;

-- name: GetVehicleTollsForMonth :one
SELECT COALESCE(SUM(c.amount), 0) AS tolls_cost
FROM Cost c
WHERE c.vehicle_id = ?
  AND c.category = 'Tolls'
  AND c.date >= ?
  AND c.date < ?;

-- name: GetDriverMileageReport :one
SELECT
  COALESCE(SUM(COALESCE(t.actual_distance_km, CAST(r.planned_distance_km AS DECIMAL(10, 2)))), 0) AS total_km,
  COUNT(DISTINCT t.order_id) AS orders_count
FROM Trips t
LEFT JOIN (
  SELECT order_id, MAX(planned_distance_km) AS planned_distance_km
  FROM Routes
  GROUP BY order_id
) r ON r.order_id = t.order_id
WHERE t.driver_id = ?
  AND t.status = 'Finished'
  AND t.end_time IS NOT NULL
  AND DATE(t.end_time) >= ?
  AND DATE(t.end_time) <= ?;

-- name: GetGlobalFuelCostInRange :one
SELECT COALESCE(SUM(fl.total_cost), 0) AS total
FROM FuelLog fl
WHERE fl.date >= ?
  AND fl.date <= ?;

-- name: GetGlobalMaintenanceCostInRange :one
SELECT COALESCE(SUM(m.total_cost_pln), 0) AS total
FROM Maintenance m
WHERE m.start_date IS NOT NULL
  AND DATE(m.start_date) >= ?
  AND DATE(m.start_date) <= ?;

-- Insurance: prorate policy cost by overlap days with the report period.
-- name: GetGlobalInsuranceCostInRange :one
SELECT COALESCE(SUM(
  ip.cost * (
    DATEDIFF(
      LEAST(ip.end_date, sqlc.arg(period_end)),
      GREATEST(ip.start_date, sqlc.arg(period_start))
    ) + 1
  ) / NULLIF(DATEDIFF(ip.end_date, ip.start_date) + 1, 0)
), 0) AS total
FROM InsurancePolicy ip
WHERE LEAST(ip.end_date, sqlc.arg(period_end)) >= GREATEST(ip.start_date, sqlc.arg(period_start));

-- name: GetGlobalTollsCostInRange :one
SELECT COALESCE(SUM(c.amount), 0) AS total
FROM Cost c
WHERE c.category = 'Tolls'
  AND c.date >= ?
  AND c.date <= ?;

-- name: GetGlobalOtherCostInRange :one
SELECT COALESCE(SUM(c.amount), 0) AS total
FROM Cost c
WHERE c.category = 'Other'
  AND c.date >= ?
  AND c.date <= ?;
