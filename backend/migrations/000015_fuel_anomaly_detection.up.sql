ALTER TABLE Alerts
  ADD COLUMN fuel_log_id INT NULL;

ALTER TABLE Alerts
  ADD CONSTRAINT fk_alerts_fuel_log
  FOREIGN KEY (fuel_log_id) REFERENCES fuel_logs(id) ON DELETE SET NULL;

CREATE INDEX idx_alerts_fuel_log_id ON Alerts(fuel_log_id);
