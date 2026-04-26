-- name: CountActiveOrders :one
SELECT COUNT(*)
FROM Orders
WHERE status IN ('New', 'Planned', 'InProgress');

-- name: CountVehiclesInService :one
SELECT COUNT(*)
FROM Vehicles
WHERE status = 'Service'
  AND deleted_at IS NULL;

-- name: GetCurrentMonthCosts :one
SELECT CAST((
  COALESCE((
    SELECT SUM(fl.total_cost)
    FROM fuel_logs fl
    WHERE DATE_FORMAT(fl.date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
  ), 0) +
  COALESCE((
    SELECT SUM(m.total_cost_pln)
    FROM Maintenance m
    WHERE m.start_date IS NOT NULL
      AND DATE_FORMAT(m.start_date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
  ), 0) +
  COALESCE((
    SELECT SUM(c.amount)
    FROM costs c
    WHERE DATE_FORMAT(c.date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
  ), 0)
) AS SIGNED) AS total_costs;

-- name: GetCurrentMonthRevenue :one
SELECT COALESCE(SUM(o.total_price_pln), 0) AS total_revenue
FROM Orders o
WHERE DATE_FORMAT(o.creation_date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m');

-- name: ListExpiringInsuranceAlerts :many
SELECT
  'insurance_expiry' AS type,
  CONCAT('Insurance policy for vehicle ', v.vin, ' expires on ', DATE_FORMAT(ip.end_date, '%Y-%m-%d')) AS message
FROM insurance_policies ip
JOIN Vehicles v ON v.vehicle_id = ip.vehicle_id
WHERE ip.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  AND v.deleted_at IS NULL
ORDER BY ip.end_date ASC
LIMIT 50;

-- name: ListUpcomingInspectionAlerts :many
SELECT
  'inspection_due' AS type,
  CONCAT('Vehicle inspection for ', v.vin, ' scheduled on ', DATE_FORMAT(v.next_inspection_date, '%Y-%m-%d')) AS message
FROM Vehicles v
WHERE v.next_inspection_date IS NOT NULL
  AND v.next_inspection_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  AND v.deleted_at IS NULL
ORDER BY v.next_inspection_date ASC
LIMIT 50;

-- name: ListExpiringLicenseAlerts :many
SELECT
  'license_expiry' AS type,
  CONCAT('Driver license for ', d.first_name, ' ', d.last_name, ' expires on ', DATE_FORMAT(d.license_expiry_date, '%Y-%m-%d')) AS message
FROM Drivers d
WHERE d.deleted_at IS NULL
  AND d.license_expiry_date IS NOT NULL
  AND d.license_expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER BY d.license_expiry_date ASC
LIMIT 50;

-- name: ListExpiringAdrAlerts :many
SELECT
  'adr_expiry' AS type,
  CONCAT('ADR certificate for ', d.first_name, ' ', d.last_name, ' expires on ', DATE_FORMAT(d.adr_expiry_date, '%Y-%m-%d')) AS message
FROM Drivers d
WHERE d.deleted_at IS NULL
  AND d.adr_certified = 1
  AND d.adr_expiry_date IS NOT NULL
  AND d.adr_expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER BY d.adr_expiry_date ASC
LIMIT 50;
