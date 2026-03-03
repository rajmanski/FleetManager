-- name: ListClients :many
SELECT
  client_id,
  company_name,
  nip,
  address,
  contact_email,
  deleted_at,
  created_at
FROM Clients
WHERE (? = 1 OR deleted_at IS NULL)
  AND (
    ? = ''
    OR LOWER(company_name) LIKE CONCAT('%', LOWER(?), '%')
    OR nip LIKE CONCAT('%', ?, '%')
  )
ORDER BY client_id DESC
LIMIT ? OFFSET ?;

-- name: CountClients :one
SELECT COUNT(*)
FROM Clients
WHERE (? = 1 OR deleted_at IS NULL)
  AND (
    ? = ''
    OR LOWER(company_name) LIKE CONCAT('%', LOWER(?), '%')
    OR nip LIKE CONCAT('%', ?, '%')
  );

-- name: GetClientByID :one
SELECT
  client_id,
  company_name,
  nip,
  address,
  contact_email,
  deleted_at,
  created_at
FROM Clients
WHERE client_id = ?
  AND deleted_at IS NULL
LIMIT 1;

-- name: CreateClient :execlastid
INSERT INTO Clients (
  company_name,
  nip,
  address,
  contact_email
)
VALUES (?, ?, ?, ?);

-- name: UpdateClient :execrows
UPDATE Clients
SET
  company_name = ?,
  nip = ?,
  address = ?,
  contact_email = ?
WHERE client_id = ?
  AND deleted_at IS NULL;

-- name: SoftDeleteClient :execrows
UPDATE Clients
SET deleted_at = NOW()
WHERE client_id = ?
  AND deleted_at IS NULL;

-- name: GetDeletedClientNIPByID :one
SELECT nip
FROM Clients
WHERE client_id = ?
  AND deleted_at IS NOT NULL
LIMIT 1;

-- name: HasActiveClientWithNIPExcludingID :one
SELECT EXISTS(
  SELECT 1
  FROM Clients
  WHERE nip = ?
    AND deleted_at IS NULL
    AND client_id <> ?
) AS has_conflict;

-- name: RestoreClientByID :execrows
UPDATE Clients
SET deleted_at = NULL
WHERE client_id = ?
  AND deleted_at IS NOT NULL;

