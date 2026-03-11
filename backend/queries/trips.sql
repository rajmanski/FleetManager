-- name: ListTrips :many
SELECT
  t.trip_id,
  t.order_id,
  o.order_number,
  t.vehicle_id,
  v.vin AS vehicle_vin,
  t.driver_id,
  d.first_name,
  d.last_name,
  t.start_time,
  t.end_time,
  t.actual_distance_km,
  t.status
FROM Trips t
JOIN Orders o ON o.order_id = t.order_id
JOIN Vehicles v ON v.vehicle_id = t.vehicle_id
JOIN Drivers d ON d.driver_id = t.driver_id
WHERE (? = '' OR t.status = ?)
ORDER BY t.trip_id DESC;

-- name: GetTripByID :one
SELECT
  t.trip_id,
  t.order_id,
  o.order_number,
  t.vehicle_id,
  v.vin AS vehicle_vin,
  t.driver_id,
  d.first_name,
  d.last_name,
  t.start_time,
  t.end_time,
  t.actual_distance_km,
  t.status
FROM Trips t
JOIN Orders o ON o.order_id = t.order_id
JOIN Vehicles v ON v.vehicle_id = t.vehicle_id
JOIN Drivers d ON d.driver_id = t.driver_id
WHERE t.trip_id = ?
LIMIT 1;

-- name: CreateTrip :execlastid
INSERT INTO Trips (order_id, vehicle_id, driver_id, start_time, status)
VALUES (?, ?, ?, ?, ?);

-- name: UpdateTripStatusStart :execrows
UPDATE Trips
SET start_time = NOW(), status = 'Active'
WHERE trip_id = ?
  AND status = 'Scheduled';

-- name: UpdateTripStatusFinish :execrows
UPDATE Trips
SET end_time = NOW(), actual_distance_km = ?, status = 'Finished'
WHERE trip_id = ?
  AND status = 'Active';

-- name: UpdateTripStatusAbort :execrows
UPDATE Trips
SET end_time = NOW(), status = 'Aborted'
WHERE trip_id = ?
  AND status IN ('Scheduled', 'Active');

-- name: UpdateVehicleStatusByID :execrows
UPDATE Vehicles
SET status = ?, updated_at = NOW()
WHERE vehicle_id = ?
  AND deleted_at IS NULL;

-- name: UpdateDriverStatusByID :execrows
UPDATE Drivers
SET status = ?, updated_at = NOW()
WHERE driver_id = ?
  AND deleted_at IS NULL;

-- name: UpdateOrderStatusByID :execrows
UPDATE Orders
SET status = ?
WHERE order_id = ?;

-- name: GetTripStatusByID :one
SELECT status
FROM Trips
WHERE trip_id = ?
LIMIT 1;

-- name: GetTripOrderVehicleDriverIDs :one
SELECT order_id, vehicle_id, driver_id
FROM Trips
WHERE trip_id = ?
LIMIT 1;
