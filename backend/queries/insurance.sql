-- name: ListInsurancePolicies :many
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
FROM insurance_policies
WHERE (? = 0 OR vehicle_id = ?)
ORDER BY id DESC
LIMIT ? OFFSET ?;

-- name: CountInsurancePolicies :one
SELECT COUNT(*)
FROM insurance_policies
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
FROM insurance_policies
WHERE id = ?
LIMIT 1;

-- name: CreateInsurancePolicy :execlastid
INSERT INTO insurance_policies (
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
UPDATE insurance_policies
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
DELETE FROM insurance_policies
WHERE id = ?;
