CREATE TABLE InsurancePolicy (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  type ENUM('OC', 'AC') NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  insurer VARCHAR(150) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id)
);
