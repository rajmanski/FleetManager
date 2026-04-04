-- name: ListSchedulerInsuranceNotifications :many
SELECT
  CONCAT('Vehicle insurance policy for VIN ', v.vin, ' expires on ', DATE_FORMAT(ip.end_date, '%Y-%m-%d')) AS message
FROM insurance_policies ip
JOIN Vehicles v ON v.vehicle_id = ip.vehicle_id
WHERE ip.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL CAST(? AS SIGNED) DAY)
  AND v.deleted_at IS NULL
ORDER BY ip.end_date ASC
LIMIT 50;

-- name: ListSchedulerInspectionNotifications :many
SELECT
  CONCAT('Vehicle inspection for VIN ', v.vin, ' scheduled on ', DATE_FORMAT(v.next_inspection_date, '%Y-%m-%d')) AS message
FROM Vehicles v
WHERE v.next_inspection_date IS NOT NULL
  AND v.next_inspection_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL CAST(? AS SIGNED) DAY)
  AND v.deleted_at IS NULL
ORDER BY v.next_inspection_date ASC
LIMIT 50;

-- name: ListSchedulerDriverLicenseExpiryNotifications :many
SELECT
  CONCAT('Driver license for ', d.first_name, ' ', d.last_name, ' expires on ', DATE_FORMAT(d.license_expiry_date, '%Y-%m-%d')) AS message
FROM Drivers d
WHERE d.deleted_at IS NULL
  AND d.license_expiry_date IS NOT NULL
  AND d.license_expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL CAST(? AS SIGNED) DAY)
ORDER BY d.license_expiry_date ASC
LIMIT 50;

-- name: ListSchedulerDriverAdrExpiryNotifications :many
SELECT
  CONCAT('ADR certificate for ', d.first_name, ' ', d.last_name, ' expires on ', DATE_FORMAT(d.adr_expiry_date, '%Y-%m-%d')) AS message
FROM Drivers d
WHERE d.deleted_at IS NULL
  AND d.adr_certified = 1
  AND d.adr_expiry_date IS NOT NULL
  AND d.adr_expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL CAST(? AS SIGNED) DAY)
ORDER BY d.adr_expiry_date ASC
LIMIT 50;
