-- name: ListOrders :many
SELECT
  o.order_id,
  o.client_id,
  o.order_number,
  o.creation_date,
  o.delivery_deadline,
  o.total_price_pln,
  o.status,
  c.company_name AS client_company_name
FROM Orders o
JOIN Clients c ON c.client_id = o.client_id AND c.deleted_at IS NULL
WHERE (? = '' OR o.status = ?)
  AND (
    ? = ''
    OR LOWER(c.company_name) LIKE CONCAT('%', LOWER(?), '%')
    OR c.nip LIKE CONCAT('%', ?, '%')
  )
ORDER BY o.order_id DESC
LIMIT ? OFFSET ?;

-- name: CountOrders :one
SELECT COUNT(*)
FROM Orders o
JOIN Clients c ON c.client_id = o.client_id AND c.deleted_at IS NULL
WHERE (? = '' OR o.status = ?)
  AND (
    ? = ''
    OR LOWER(c.company_name) LIKE CONCAT('%', LOWER(?), '%')
    OR c.nip LIKE CONCAT('%', ?, '%')
  );

-- name: GetOrderByID :one
SELECT
  o.order_id,
  o.client_id,
  o.order_number,
  o.creation_date,
  o.delivery_deadline,
  o.total_price_pln,
  o.status
FROM Orders o
WHERE o.order_id = ?
LIMIT 1;

-- name: CreateOrder :execlastid
INSERT INTO Orders (client_id, order_number, delivery_deadline, total_price_pln, status)
VALUES (?, ?, ?, ?, ?);

-- name: UpdateOrder :execrows
UPDATE Orders
SET
  client_id = ?,
  order_number = ?,
  delivery_deadline = ?,
  total_price_pln = ?,
  status = ?
WHERE order_id = ?;

-- name: CancelOrderByID :execrows
UPDATE Orders
SET status = 'Cancelled'
WHERE order_id = ?
  AND status NOT IN ('Completed', 'Cancelled');

-- name: ExistsOrderWithOrderNumber :one
SELECT EXISTS(
  SELECT 1 FROM Orders WHERE order_number = ? AND order_id <> ?
) AS exists_flag;
