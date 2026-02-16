CREATE TABLE Trips (
  trip_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  status ENUM('Scheduled', 'Active', 'Finished', 'Aborted') NOT NULL
);
