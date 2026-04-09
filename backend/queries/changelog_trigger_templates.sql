-- Generic template: INSERT
CREATE TRIGGER trg_{table_slug}_audit_insert
AFTER INSERT ON {TableName}
FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (
  @current_user_id,
  '{table_slug}',
  NEW.{primary_key},
  'INSERT',
  NULL,
  JSON_OBJECT({new_columns_json}),
  NOW()
);

-- Generic template: UPDATE
CREATE TRIGGER trg_{table_slug}_audit_update
AFTER UPDATE ON {TableName}
FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (
  @current_user_id,
  '{table_slug}',
  NEW.{primary_key},
  'UPDATE',
  JSON_OBJECT({old_columns_json}),
  JSON_OBJECT({new_columns_json}),
  NOW()
);

-- Generic template: DELETE
CREATE TRIGGER trg_{table_slug}_audit_delete
AFTER DELETE ON {TableName}
FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (
  @current_user_id,
  '{table_slug}',
  OLD.{primary_key},
  'DELETE',
  JSON_OBJECT({old_columns_json}),
  NULL,
  NOW()
);
