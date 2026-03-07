-- name: OrderHasHazardousCargo :one
SELECT EXISTS(
  SELECT 1
  FROM Cargo
  WHERE order_id = ?
    AND cargo_type = 'Hazardous'
);

-- name: ListCargoByOrderID :many
SELECT cargo_id, order_id, destination_waypoint_id, description, weight_kg, volume_m3, cargo_type
FROM Cargo
WHERE order_id = ?
ORDER BY cargo_id;

-- name: GetCargoByID :one
SELECT cargo_id, order_id, destination_waypoint_id, description, weight_kg, volume_m3, cargo_type
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

-- name: AssignCargoWaypoint :execrows
UPDATE Cargo
SET destination_waypoint_id = ?
WHERE cargo_id = ?;

-- name: GetOrderStatusByCargoID :one
SELECT o.status
FROM Cargo c
JOIN Orders o ON o.order_id = c.order_id
WHERE c.cargo_id = ?
LIMIT 1;

-- name: WaypointBelongsToCargoOrder :one
SELECT EXISTS(
  SELECT 1
  FROM Cargo c
  JOIN Routes r ON r.order_id = c.order_id
  JOIN RouteWaypoints rw ON rw.route_id = r.route_id
  WHERE c.cargo_id = ? AND rw.waypoint_id = ?
);
