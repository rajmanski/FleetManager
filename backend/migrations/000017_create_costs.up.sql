CREATE TABLE costs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  category ENUM('Tolls', 'Other') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT NULL,
  invoice_number VARCHAR(100) NULL,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id)
);

CREATE INDEX idx_costs_vehicle_id ON costs(vehicle_id);
CREATE INDEX idx_costs_category ON costs(category);
CREATE INDEX idx_costs_date ON costs(date);
