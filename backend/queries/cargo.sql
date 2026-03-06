-- name: OrderHasHazardousCargo :one
SELECT EXISTS(
  SELECT 1
  FROM Cargo
  WHERE order_id = ?
    AND cargo_type = 'Hazardous'
);

-- name: ListCargoByOrderID :many
SELECT cargo_id, order_id, description, weight_kg, volume_m3, cargo_type
FROM Cargo
WHERE order_id = ?
ORDER BY cargo_id;

-- name: GetCargoByID :one
SELECT cargo_id, order_id, description, weight_kg, volume_m3, cargo_type
FROM Cargo
WHERE cargo_id = ?
LIMIT 1;

-- name: CreateCargo :execlastid
INSERT INTO Cargo (order_id, description, weight_kg, volume_m3, cargo_type)
VALUES (?, ?, ?, ?, ?);

-- name: UpdateCargo :execrows
UPDATE Cargo
SET description = ?, weight_kg = ?, volume_m3 = ?, cargo_type = ?
WHERE cargo_id = ?;

-- name: DeleteCargo :execrows
DELETE FROM Cargo WHERE cargo_id = ?;
