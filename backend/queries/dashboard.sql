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
SELECT (
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
) AS total_costs;

-- name: GetCurrentMonthRevenue :one
SELECT COALESCE(SUM(o.total_price_pln), 0) AS total_revenue
FROM Orders o
WHERE DATE_FORMAT(o.creation_date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m');

-- name: ListExpiringInsuranceAlerts :many
SELECT
  'insurance_expiry' AS type,
  CONCAT('Polisa pojazdu ', v.vin, ' wygasa ', DATE_FORMAT(ip.end_date, '%Y-%m-%d')) AS message
FROM insurance_policies ip
JOIN Vehicles v ON v.vehicle_id = ip.vehicle_id
WHERE ip.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  AND v.deleted_at IS NULL
ORDER BY ip.end_date ASC
LIMIT 50;

-- name: ListUpcomingInspectionAlerts :many
SELECT
  'inspection_due' AS type,
  CONCAT('Przeglad pojazdu ', v.vin, ' zaplanowany na ', DATE_FORMAT(v.next_inspection_date, '%Y-%m-%d')) AS message
FROM Vehicles v
WHERE v.next_inspection_date IS NOT NULL
  AND v.next_inspection_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  AND v.deleted_at IS NULL
ORDER BY v.next_inspection_date ASC
LIMIT 50;

-- name: ListExpiringCertificateAlerts :many
SELECT
  'certificate_expiry' AS type,
  CONCAT('Certyfikat kierowcy ', d.first_name, ' ', d.last_name, ' wygasa ', DATE_FORMAT(d.expiry_date, '%Y-%m-%d')) AS message
FROM (
  SELECT driver_id, first_name, last_name, license_expiry_date AS expiry_date
  FROM Drivers
  WHERE deleted_at IS NULL
    AND license_expiry_date IS NOT NULL
    AND license_expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  UNION ALL
  SELECT driver_id, first_name, last_name, adr_expiry_date AS expiry_date
  FROM Drivers
  WHERE deleted_at IS NULL
    AND adr_certified = 1
    AND adr_expiry_date IS NOT NULL
    AND adr_expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
) d
ORDER BY d.expiry_date ASC
LIMIT 50;
