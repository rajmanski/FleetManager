-- name: ListWaypointsByRouteID :many
SELECT
  waypoint_id,
  route_id,
  sequence_order,
  address,
  latitude,
  longitude,
  action_type
FROM RouteWaypoints
WHERE route_id = ?
ORDER BY sequence_order ASC;

-- name: GetWaypointByID :one
SELECT
  waypoint_id,
  route_id,
  sequence_order,
  address,
  latitude,
  longitude,
  action_type
FROM RouteWaypoints
WHERE waypoint_id = ?
LIMIT 1;

-- name: CountWaypointsByRouteID :one
SELECT COUNT(*)
FROM RouteWaypoints
WHERE route_id = ?;

-- name: CreateWaypoint :execlastid
INSERT INTO RouteWaypoints (
  route_id,
  sequence_order,
  address,
  latitude,
  longitude,
  action_type
)
VALUES (?, ?, ?, ?, ?, ?);

-- name: UpdateWaypoint :execrows
UPDATE RouteWaypoints
SET
  sequence_order = ?,
  address = ?,
  latitude = ?,
  longitude = ?,
  action_type = ?
WHERE waypoint_id = ?;

-- name: DeleteWaypoint :execrows
DELETE FROM RouteWaypoints
WHERE waypoint_id = ?;

-- name: GetWaypointRouteID :one
SELECT route_id
FROM RouteWaypoints
WHERE waypoint_id = ?
LIMIT 1;

-- name: GetMaxSequenceOrder :one
SELECT COALESCE(MAX(sequence_order), 0) AS max_order
FROM RouteWaypoints
WHERE route_id = ?;

-- name: RenumberWaypointsAfterDelete :exec
UPDATE RouteWaypoints
SET sequence_order = sequence_order - 1
WHERE route_id = ?
  AND sequence_order > ?;

-- name: ListWaypointIDsByRouteID :many
SELECT waypoint_id, sequence_order
FROM RouteWaypoints
WHERE route_id = ?
ORDER BY sequence_order ASC;

-- name: UpdateWaypointSequence :execrows
UPDATE RouteWaypoints
SET sequence_order = ?
WHERE waypoint_id = ?;
