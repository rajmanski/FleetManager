-- name: OrderHasHazardousCargo :one
SELECT EXISTS(
  SELECT 1
  FROM Cargo
  WHERE order_id = ?
    AND cargo_type = 'Hazardous'
);
