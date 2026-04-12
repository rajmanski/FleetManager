DROP TRIGGER IF EXISTS trg_dictionaries_audit_insert;
DROP TRIGGER IF EXISTS trg_dictionaries_audit_update;
DROP TRIGGER IF EXISTS trg_dictionaries_audit_delete;

CREATE TRIGGER trg_dictionaries_audit_insert AFTER INSERT ON Dictionaries FOR EACH ROW INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp) VALUES (@current_user_id, 'dictionaries', NEW.id, 'INSERT', NULL, JSON_OBJECT('id', NEW.id, 'category', NEW.category, 'key', NEW.`key`, 'value', NEW.`value`, 'created_at', NEW.created_at), NOW());

CREATE TRIGGER trg_dictionaries_audit_update AFTER UPDATE ON Dictionaries FOR EACH ROW INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp) VALUES (@current_user_id, 'dictionaries', NEW.id, 'UPDATE', JSON_OBJECT('id', OLD.id, 'category', OLD.category, 'key', OLD.`key`, 'value', OLD.`value`, 'created_at', OLD.created_at), JSON_OBJECT('id', NEW.id, 'category', NEW.category, 'key', NEW.`key`, 'value', NEW.`value`, 'created_at', NEW.created_at), NOW());

CREATE TRIGGER trg_dictionaries_audit_delete AFTER DELETE ON Dictionaries FOR EACH ROW INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp) VALUES (@current_user_id, 'dictionaries', OLD.id, 'DELETE', JSON_OBJECT('id', OLD.id, 'category', OLD.category, 'key', OLD.`key`, 'value', OLD.`value`, 'created_at', OLD.created_at), NULL, NOW());
