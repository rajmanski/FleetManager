-- name: ListCosts :many
SELECT
  id,
  vehicle_id,
  category,
  amount,
  date,
  description,
  invoice_number,
  created_at
FROM costs
WHERE (? = 0 OR vehicle_id = ?)
ORDER BY id DESC
LIMIT ? OFFSET ?;

-- name: CountCosts :one
SELECT COUNT(*)
FROM costs
WHERE (? = 0 OR vehicle_id = ?);

-- name: GetCostByID :one
SELECT
  id,
  vehicle_id,
  category,
  amount,
  date,
  description,
  invoice_number,
  created_at
FROM costs
WHERE id = ?
LIMIT 1;

-- name: CreateCost :execlastid
INSERT INTO costs (
  vehicle_id,
  category,
  amount,
  date,
  description,
  invoice_number
)
VALUES (?, ?, ?, ?, ?, ?);

-- name: UpdateCost :execrows
UPDATE costs
SET
  vehicle_id = ?,
  category = ?,
  amount = ?,
  date = ?,
  description = ?,
  invoice_number = ?
WHERE id = ?;

-- name: DeleteCost :execrows
DELETE FROM costs
WHERE id = ?;
