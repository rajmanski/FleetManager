-- name: ListDictionariesByCategory :many
SELECT
  id,
  category,
  `key`,
  `value`,
  created_at
FROM Dictionaries
WHERE category = ?
ORDER BY `key` ASC;

-- name: GetDictionaryByID :one
SELECT
  id,
  category,
  `key`,
  `value`,
  created_at
FROM Dictionaries
WHERE id = ?
LIMIT 1;

-- name: CreateDictionary :execlastid
INSERT INTO Dictionaries (category, `key`, `value`)
VALUES (?, ?, ?);

-- name: UpdateDictionary :execresult
UPDATE Dictionaries
SET
  category = ?,
  `key` = ?,
  `value` = ?
WHERE id = ?;

-- name: DeleteDictionary :execresult
DELETE FROM Dictionaries
WHERE id = ?;
