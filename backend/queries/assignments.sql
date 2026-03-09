-- name: ListAssignments :many
SELECT
  a.assignment_id,
  a.vehicle_id,
  a.driver_id,
  a.assigned_from,
  a.assigned_to,
  v.vin,
  v.brand,
  v.model,
  d.first_name,
  d.last_name
FROM Assignments a
JOIN Vehicles v ON v.vehicle_id = a.vehicle_id AND v.deleted_at IS NULL
JOIN Drivers d ON d.driver_id = a.driver_id AND d.deleted_at IS NULL
WHERE (? = 0 OR a.assigned_to IS NULL)
ORDER BY a.assignment_id DESC
LIMIT ? OFFSET ?;

-- name: CountAssignments :one
SELECT COUNT(*)
FROM Assignments a
JOIN Vehicles v ON v.vehicle_id = a.vehicle_id AND v.deleted_at IS NULL
JOIN Drivers d ON d.driver_id = a.driver_id AND d.deleted_at IS NULL
WHERE (? = 0 OR a.assigned_to IS NULL);

-- name: CreateAssignment :execlastid
INSERT INTO Assignments (vehicle_id, driver_id, assigned_from)
VALUES (?, ?, ?);

-- name: GetAssignmentByID :one
SELECT
  a.assignment_id,
  a.vehicle_id,
  a.driver_id,
  a.assigned_from,
  a.assigned_to,
  v.vin,
  v.brand,
  v.model,
  d.first_name,
  d.last_name
FROM Assignments a
JOIN Vehicles v ON v.vehicle_id = a.vehicle_id
JOIN Drivers d ON d.driver_id = a.driver_id
WHERE a.assignment_id = ?
LIMIT 1;

-- name: EndAssignment :execrows
UPDATE Assignments
SET assigned_to = ?
WHERE assignment_id = ?
  AND assigned_to IS NULL;

-- name: HasDriverActiveAssignmentExcludingID :one
SELECT EXISTS(
  SELECT 1
  FROM Assignments
  WHERE driver_id = ?
    AND assigned_to IS NULL
    AND (? = 0 OR assignment_id <> ?)
);

-- name: HasDriverOverlappingAssignment :one
SELECT EXISTS(
  SELECT 1
  FROM Assignments
  WHERE driver_id = ?
    AND assigned_from <= ?
    AND (assigned_to IS NULL OR assigned_to > ?)
);

-- name: ListAssignmentsByVehicleID :many
SELECT
  a.assignment_id,
  a.vehicle_id,
  a.driver_id,
  a.assigned_from,
  a.assigned_to,
  v.vin,
  v.brand,
  v.model,
  d.first_name,
  d.last_name
FROM Assignments a
JOIN Vehicles v ON v.vehicle_id = a.vehicle_id
JOIN Drivers d ON d.driver_id = a.driver_id
WHERE a.vehicle_id = ?
ORDER BY a.assigned_from DESC;

-- name: ListAssignmentsByDriverID :many
SELECT
  a.assignment_id,
  a.vehicle_id,
  a.driver_id,
  a.assigned_from,
  a.assigned_to,
  v.vin,
  v.brand,
  v.model,
  d.first_name,
  d.last_name
FROM Assignments a
JOIN Vehicles v ON v.vehicle_id = a.vehicle_id
JOIN Drivers d ON d.driver_id = a.driver_id
WHERE a.driver_id = ?
ORDER BY a.assigned_from DESC;
