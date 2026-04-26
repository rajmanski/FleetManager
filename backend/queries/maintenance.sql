-- name: ListMaintenance :many
SELECT
  maintenance_id,
  vehicle_id,
  start_date,
  end_date,
  type,
  status,
  description,
  labor_cost_pln,
  parts_cost_pln,
  total_cost_pln,
  created_at,
  updated_at
FROM Maintenance
WHERE (? = 0 OR vehicle_id = ?)
  AND (? = '' OR status = ?)
ORDER BY maintenance_id DESC
LIMIT ? OFFSET ?;

-- name: CountMaintenance :one
SELECT COUNT(*)
FROM Maintenance
WHERE (? = 0 OR vehicle_id = ?)
  AND (? = '' OR status = ?);

-- name: GetMaintenanceByID :one
SELECT
  maintenance_id,
  vehicle_id,
  start_date,
  end_date,
  type,
  status,
  description,
  labor_cost_pln,
  parts_cost_pln,
  total_cost_pln,
  created_at,
  updated_at
FROM Maintenance
WHERE maintenance_id = ?
LIMIT 1;

-- name: CreateMaintenance :execlastid
INSERT INTO Maintenance (
  vehicle_id,
  start_date,
  end_date,
  type,
  status,
  description,
  labor_cost_pln,
  parts_cost_pln
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- name: UpdateMaintenance :execrows
UPDATE Maintenance
SET
  vehicle_id = ?,
  start_date = ?,
  end_date = ?,
  type = ?,
  status = ?,
  description = ?,
  labor_cost_pln = ?,
  parts_cost_pln = ?,
  updated_at = NOW()
WHERE maintenance_id = ?;

-- name: UpdateMaintenanceStatus :execrows
UPDATE Maintenance
SET
  status = ?,
  end_date = CASE WHEN ? = 'Completed' THEN NOW() ELSE end_date END,
  updated_at = NOW()
WHERE maintenance_id = ?;
