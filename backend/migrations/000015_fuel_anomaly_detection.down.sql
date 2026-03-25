DROP INDEX idx_alerts_fuel_log_id ON Alerts;
ALTER TABLE Alerts DROP FOREIGN KEY fk_alerts_fuel_log;
ALTER TABLE Alerts DROP COLUMN fuel_log_id;
