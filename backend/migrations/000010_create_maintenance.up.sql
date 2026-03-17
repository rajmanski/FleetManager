CREATE TABLE Maintenance (
  maintenance_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  start_date DATETIME NULL,
  end_date DATETIME NULL,
  type ENUM('Routine', 'Repair', 'TireChange') NOT NULL,
  status ENUM('Scheduled', 'InProgress', 'Completed') NOT NULL DEFAULT 'Scheduled',
  description TEXT,
  labor_cost_pln DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  parts_cost_pln DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_cost_pln DECIMAL(10,2) GENERATED ALWAYS AS (labor_cost_pln + parts_cost_pln) STORED,
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id)
);

CREATE INDEX idx_maintenance_vehicle_id ON Maintenance(vehicle_id);
CREATE INDEX idx_maintenance_status ON Maintenance(status);
CREATE INDEX idx_maintenance_type ON Maintenance(type);
