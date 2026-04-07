CREATE TRIGGER trg_vehicles_changelog_insert AFTER INSERT ON Vehicles FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'vehicles', NEW.vehicle_id, 'INSERT', NULL, JSON_OBJECT('vehicle_id', NEW.vehicle_id, 'vin', NEW.vin, 'status', NEW.status), NOW());

CREATE TRIGGER trg_vehicles_changelog_update AFTER UPDATE ON Vehicles FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'vehicles', NEW.vehicle_id, 'UPDATE', JSON_OBJECT('vehicle_id', OLD.vehicle_id, 'vin', OLD.vin, 'status', OLD.status), JSON_OBJECT('vehicle_id', NEW.vehicle_id, 'vin', NEW.vin, 'status', NEW.status), NOW());

CREATE TRIGGER trg_vehicles_changelog_delete AFTER DELETE ON Vehicles FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'vehicles', OLD.vehicle_id, 'DELETE', JSON_OBJECT('vehicle_id', OLD.vehicle_id, 'vin', OLD.vin, 'status', OLD.status), NULL, NOW());

CREATE TRIGGER trg_drivers_changelog_insert AFTER INSERT ON Drivers FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'drivers', NEW.driver_id, 'INSERT', NULL, JSON_OBJECT('driver_id', NEW.driver_id, 'user_id', NEW.user_id, 'status', NEW.status), NOW());

CREATE TRIGGER trg_drivers_changelog_update AFTER UPDATE ON Drivers FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'drivers', NEW.driver_id, 'UPDATE', JSON_OBJECT('driver_id', OLD.driver_id, 'user_id', OLD.user_id, 'status', OLD.status), JSON_OBJECT('driver_id', NEW.driver_id, 'user_id', NEW.user_id, 'status', NEW.status), NOW());

CREATE TRIGGER trg_drivers_changelog_delete AFTER DELETE ON Drivers FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'drivers', OLD.driver_id, 'DELETE', JSON_OBJECT('driver_id', OLD.driver_id, 'user_id', OLD.user_id, 'status', OLD.status), NULL, NOW());

CREATE TRIGGER trg_orders_changelog_insert AFTER INSERT ON Orders FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'orders', NEW.order_id, 'INSERT', NULL, JSON_OBJECT('order_id', NEW.order_id, 'client_id', NEW.client_id, 'status', NEW.status), NOW());

CREATE TRIGGER trg_orders_changelog_update AFTER UPDATE ON Orders FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'orders', NEW.order_id, 'UPDATE', JSON_OBJECT('order_id', OLD.order_id, 'client_id', OLD.client_id, 'status', OLD.status), JSON_OBJECT('order_id', NEW.order_id, 'client_id', NEW.client_id, 'status', NEW.status), NOW());

CREATE TRIGGER trg_orders_changelog_delete AFTER DELETE ON Orders FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'orders', OLD.order_id, 'DELETE', JSON_OBJECT('order_id', OLD.order_id, 'client_id', OLD.client_id, 'status', OLD.status), NULL, NOW());

CREATE TRIGGER trg_assignments_changelog_insert AFTER INSERT ON Assignments FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'assignments', NEW.assignment_id, 'INSERT', NULL, JSON_OBJECT('assignment_id', NEW.assignment_id, 'vehicle_id', NEW.vehicle_id, 'driver_id', NEW.driver_id), NOW());

CREATE TRIGGER trg_assignments_changelog_update AFTER UPDATE ON Assignments FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'assignments', NEW.assignment_id, 'UPDATE', JSON_OBJECT('assignment_id', OLD.assignment_id, 'vehicle_id', OLD.vehicle_id, 'driver_id', OLD.driver_id), JSON_OBJECT('assignment_id', NEW.assignment_id, 'vehicle_id', NEW.vehicle_id, 'driver_id', NEW.driver_id), NOW());

CREATE TRIGGER trg_assignments_changelog_delete AFTER DELETE ON Assignments FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'assignments', OLD.assignment_id, 'DELETE', JSON_OBJECT('assignment_id', OLD.assignment_id, 'vehicle_id', OLD.vehicle_id, 'driver_id', OLD.driver_id), NULL, NOW());

CREATE TRIGGER trg_maintenance_changelog_insert AFTER INSERT ON Maintenance FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'maintenance', NEW.maintenance_id, 'INSERT', NULL, JSON_OBJECT('maintenance_id', NEW.maintenance_id, 'vehicle_id', NEW.vehicle_id, 'status', NEW.status), NOW());

CREATE TRIGGER trg_maintenance_changelog_update AFTER UPDATE ON Maintenance FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'maintenance', NEW.maintenance_id, 'UPDATE', JSON_OBJECT('maintenance_id', OLD.maintenance_id, 'vehicle_id', OLD.vehicle_id, 'status', OLD.status), JSON_OBJECT('maintenance_id', NEW.maintenance_id, 'vehicle_id', NEW.vehicle_id, 'status', NEW.status), NOW());

CREATE TRIGGER trg_maintenance_changelog_delete AFTER DELETE ON Maintenance FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'maintenance', OLD.maintenance_id, 'DELETE', JSON_OBJECT('maintenance_id', OLD.maintenance_id, 'vehicle_id', OLD.vehicle_id, 'status', OLD.status), NULL, NOW());

CREATE TRIGGER trg_fuel_logs_changelog_insert AFTER INSERT ON fuel_logs FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'fuel_logs', NEW.id, 'INSERT', NULL, JSON_OBJECT('id', NEW.id, 'vehicle_id', NEW.vehicle_id, 'total_cost', NEW.total_cost), NOW());

CREATE TRIGGER trg_fuel_logs_changelog_update AFTER UPDATE ON fuel_logs FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'fuel_logs', NEW.id, 'UPDATE', JSON_OBJECT('id', OLD.id, 'vehicle_id', OLD.vehicle_id, 'total_cost', OLD.total_cost), JSON_OBJECT('id', NEW.id, 'vehicle_id', NEW.vehicle_id, 'total_cost', NEW.total_cost), NOW());

CREATE TRIGGER trg_fuel_logs_changelog_delete AFTER DELETE ON fuel_logs FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'fuel_logs', OLD.id, 'DELETE', JSON_OBJECT('id', OLD.id, 'vehicle_id', OLD.vehicle_id, 'total_cost', OLD.total_cost), NULL, NOW());

CREATE TRIGGER trg_insurance_policies_changelog_insert AFTER INSERT ON insurance_policies FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'insurance_policies', NEW.id, 'INSERT', NULL, JSON_OBJECT('id', NEW.id, 'vehicle_id', NEW.vehicle_id, 'type', NEW.type), NOW());

CREATE TRIGGER trg_insurance_policies_changelog_update AFTER UPDATE ON insurance_policies FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'insurance_policies', NEW.id, 'UPDATE', JSON_OBJECT('id', OLD.id, 'vehicle_id', OLD.vehicle_id, 'type', OLD.type), JSON_OBJECT('id', NEW.id, 'vehicle_id', NEW.vehicle_id, 'type', NEW.type), NOW());

CREATE TRIGGER trg_insurance_policies_changelog_delete AFTER DELETE ON insurance_policies FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'insurance_policies', OLD.id, 'DELETE', JSON_OBJECT('id', OLD.id, 'vehicle_id', OLD.vehicle_id, 'type', OLD.type), NULL, NOW());

CREATE TRIGGER trg_costs_changelog_insert AFTER INSERT ON costs FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'costs', NEW.id, 'INSERT', NULL, JSON_OBJECT('id', NEW.id, 'vehicle_id', NEW.vehicle_id, 'category', NEW.category, 'amount', NEW.amount), NOW());

CREATE TRIGGER trg_costs_changelog_update AFTER UPDATE ON costs FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'costs', NEW.id, 'UPDATE', JSON_OBJECT('id', OLD.id, 'vehicle_id', OLD.vehicle_id, 'category', OLD.category, 'amount', OLD.amount), JSON_OBJECT('id', NEW.id, 'vehicle_id', NEW.vehicle_id, 'category', NEW.category, 'amount', NEW.amount), NOW());

CREATE TRIGGER trg_costs_changelog_delete AFTER DELETE ON costs FOR EACH ROW
INSERT INTO Changelog (user_id, table_name, record_id, operation, old_data, new_data, timestamp)
VALUES (@current_user_id, 'costs', OLD.id, 'DELETE', JSON_OBJECT('id', OLD.id, 'vehicle_id', OLD.vehicle_id, 'category', OLD.category, 'amount', OLD.amount), NULL, NOW());
