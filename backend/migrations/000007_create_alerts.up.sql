CREATE TABLE Alerts (
  alert_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NULL,
  alert_type VARCHAR(50) NOT NULL,
  message TEXT,
  created_at DATETIME DEFAULT NOW(),
  is_resolved TINYINT(1) DEFAULT 0,
  FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id) ON DELETE SET NULL
);

CREATE INDEX idx_alerts_vehicle_id ON Alerts(vehicle_id);
CREATE INDEX idx_alerts_alert_type ON Alerts(alert_type);
CREATE INDEX idx_alerts_is_resolved ON Alerts(is_resolved);
