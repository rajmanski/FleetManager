-- name: ListInsurancePolicy :many
SELECT
  id,
  vehicle_id,
  type,
  policy_number,
  insurer,
  start_date,
  end_date,
  cost,
  created_at,
  updated_at
FROM InsurancePolicy
WHERE (? = 0 OR vehicle_id = ?)
ORDER BY id DESC
LIMIT ? OFFSET ?;

-- name: CountInsurancePolicy :one
SELECT COUNT(*)
FROM InsurancePolicy
WHERE (? = 0 OR vehicle_id = ?);

-- name: GetInsurancePolicyByID :one
SELECT
  id,
  vehicle_id,
  type,
  policy_number,
  insurer,
  start_date,
  end_date,
  cost,
  created_at,
  updated_at
FROM InsurancePolicy
WHERE id = ?
LIMIT 1;

-- name: CreateInsurancePolicy :execlastid
INSERT INTO InsurancePolicy (
  vehicle_id,
  type,
  policy_number,
  insurer,
  start_date,
  end_date,
  cost
)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: UpdateInsurancePolicy :execrows
UPDATE InsurancePolicy
SET
  vehicle_id = ?,
  type = ?,
  policy_number = ?,
  insurer = ?,
  start_date = ?,
  end_date = ?,
  cost = ?,
  updated_at = NOW()
WHERE id = ?;

-- name: DeleteInsurancePolicy :execrows
DELETE FROM InsurancePolicy
WHERE id = ?;
