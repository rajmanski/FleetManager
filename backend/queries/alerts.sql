-- name: CreateAlert :execlastid
INSERT INTO Alerts (vehicle_id, alert_type, message, is_resolved)
VALUES (?, ?, ?, 0);

-- name: CreateFuelAnomalyAlert :execlastid
INSERT INTO Alerts (vehicle_id, fuel_log_id, alert_type, message, is_resolved)
VALUES (?, ?, 'fuel_anomaly', ?, 0);

-- name: GetActiveAssignmentVehicleID :one
SELECT vehicle_id
FROM Assignments
WHERE driver_id = ?
  AND assigned_to IS NULL
LIMIT 1;

-- name: ListDriversWithExpiringCertificates :many
SELECT driver_id, license_expiry_date, adr_certified, adr_expiry_date
FROM Drivers
WHERE deleted_at IS NULL
  AND (
    (license_expiry_date IS NOT NULL AND license_expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY))
    OR (adr_certified = 1 AND adr_expiry_date IS NOT NULL AND adr_expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY))
  )
LIMIT 500;
