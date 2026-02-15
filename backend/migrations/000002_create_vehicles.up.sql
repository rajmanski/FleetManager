CREATE TABLE Vehicles (
  vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
  vin VARCHAR(17) NOT NULL,
  plate_number VARCHAR(20),
  brand VARCHAR(50),
  model VARCHAR(50),
  production_year YEAR,
  capacity_kg INT UNSIGNED,
  current_mileage_km INT UNSIGNED DEFAULT 0,
  status ENUM('Available', 'InRoute', 'Service', 'Inactive') DEFAULT 'Available',
  deleted_at DATETIME NULL,
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
);

CREATE UNIQUE INDEX idx_vehicles_vin ON Vehicles(vin);
CREATE INDEX idx_vehicles_status ON Vehicles(status);
