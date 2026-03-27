-- name: GetVehicleRevenueForMonth :one
SELECT COALESCE(SUM(o.total_price_pln), 0) AS revenue
FROM Orders o
WHERE o.order_id IN (
  SELECT DISTINCT t.order_id
  FROM Trips t
  WHERE t.vehicle_id = ?
)
  AND DATE_FORMAT(o.creation_date, '%Y-%m') = ?;

-- name: GetVehicleFuelCostsForMonth :one
SELECT COALESCE(SUM(fl.total_cost), 0) AS fuel_cost
FROM fuel_logs fl
WHERE fl.vehicle_id = ?
  AND DATE_FORMAT(fl.date, '%Y-%m') = ?;

-- name: GetVehicleMaintenanceCostsForMonth :one
SELECT COALESCE(SUM(m.total_cost_pln), 0) AS maintenance_cost
FROM Maintenance m
WHERE m.vehicle_id = ?
  AND m.start_date IS NOT NULL
  AND DATE_FORMAT(m.start_date, '%Y-%m') = ?;

-- name: GetVehicleInsuranceMonthlyCost :one
SELECT COALESCE(SUM(ip.cost / 12), 0) AS insurance_cost
FROM insurance_policies ip
WHERE ip.vehicle_id = ?
  AND ip.start_date <= ?
  AND ip.end_date >= ?;

-- name: GetVehicleTollsForMonth :one
SELECT COALESCE(SUM(c.amount), 0) AS tolls_cost
FROM costs c
WHERE c.vehicle_id = ?
  AND c.category = 'Tolls'
  AND DATE_FORMAT(c.date, '%Y-%m') = ?;
