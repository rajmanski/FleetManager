-- name: GetRouteByID :one
SELECT route_id, order_id, start_location, end_location, planned_distance_km, estimated_time_min
FROM Routes
WHERE route_id = ?
LIMIT 1;

-- name: CountActiveTripsForOrder :one
SELECT COUNT(*)
FROM Trips
WHERE order_id = ?
  AND status IN ('Scheduled', 'Active');
