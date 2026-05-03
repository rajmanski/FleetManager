CREATE TABLE Cost (
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

CREATE INDEX idx_Cost_vehicle_id ON Cost(vehicle_id);
CREATE INDEX idx_Cost_category ON Cost(category);
CREATE INDEX idx_Cost_date ON Cost(date);
