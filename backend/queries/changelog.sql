-- name: ListChangelog :many
SELECT
  id,
  user_id,
  table_name,
  record_id,
  operation,
  old_data,
  new_data,
  `timestamp`
FROM Changelog
WHERE (? = 0 OR user_id = ?)
  AND (? = '' OR table_name = ?)
  AND (? = '' OR operation = ?)
  AND (? = 0 OR `timestamp` >= ?)
  AND (? = 0 OR `timestamp` <= ?)
ORDER BY `timestamp` DESC
LIMIT ? OFFSET ?;

-- name: CountChangelog :one
SELECT COUNT(*)
FROM Changelog
WHERE (? = 0 OR user_id = ?)
  AND (? = '' OR table_name = ?)
  AND (? = '' OR operation = ?)
  AND (? = 0 OR `timestamp` >= ?)
  AND (? = 0 OR `timestamp` <= ?);
