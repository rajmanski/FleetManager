CREATE TABLE fuel_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  date DATE NOT NULL,
  liters DECIMAL(10,2) NOT NULL,
  price_per_liter DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  mileage INT UNSIGNED NOT NULL,
  location VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id)
);

CREATE INDEX idx_fuel_logs_vehicle_id_date ON fuel_logs(vehicle_id, date);
