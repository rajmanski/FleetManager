CREATE TABLE Clients (
  client_id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(200) NOT NULL,
  nip VARCHAR(10) UNIQUE NOT NULL,
  address TEXT,
  contact_email VARCHAR(150),
  deleted_at DATETIME NULL,
  created_at DATETIME DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_clients_nip ON Clients(nip);
CREATE INDEX idx_clients_company_name ON Clients(company_name);
CREATE INDEX idx_clients_deleted_at ON Clients(deleted_at);

CREATE TABLE Orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  creation_date DATETIME DEFAULT NOW(),
  delivery_deadline DATETIME,
  total_price_pln DECIMAL(10,2),
  status ENUM('New', 'Planned', 'InProgress', 'Completed', 'Cancelled') DEFAULT 'New',
  FOREIGN KEY (client_id) REFERENCES Clients(client_id)
);

CREATE UNIQUE INDEX idx_orders_order_number ON Orders(order_number);
CREATE INDEX idx_orders_client_id ON Orders(client_id);
CREATE INDEX idx_orders_status ON Orders(status);
CREATE INDEX idx_orders_delivery_deadline ON Orders(delivery_deadline);

CREATE TABLE Assignments (
  assignment_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  driver_id INT NOT NULL,
  assigned_from DATETIME NOT NULL,
  assigned_to DATETIME NULL,
  FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id),
  FOREIGN KEY (driver_id) REFERENCES Drivers(driver_id)
);

CREATE INDEX idx_assignments_vehicle_id ON Assignments(vehicle_id);
CREATE INDEX idx_assignments_driver_id ON Assignments(driver_id);
CREATE INDEX idx_assignments_dates ON Assignments(assigned_from, assigned_to);

CREATE TABLE Trips (
  trip_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  driver_id INT NOT NULL,
  start_time DATETIME,
  end_time DATETIME NULL,
  actual_distance_km INT,
  status ENUM('Scheduled', 'Active', 'Finished', 'Aborted') DEFAULT 'Scheduled',
  FOREIGN KEY (order_id) REFERENCES Orders(order_id),
  FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id),
  FOREIGN KEY (driver_id) REFERENCES Drivers(driver_id)
);

CREATE INDEX idx_trips_order_id ON Trips(order_id);
CREATE INDEX idx_trips_vehicle_id ON Trips(vehicle_id);
CREATE INDEX idx_trips_driver_id ON Trips(driver_id);
CREATE INDEX idx_trips_status ON Trips(status);
