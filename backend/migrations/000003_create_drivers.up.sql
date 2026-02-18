CREATE TABLE Drivers (
  driver_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  pesel VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  email VARCHAR(150) NULL,
  status ENUM('Available', 'OnLeave', 'InRoute') DEFAULT 'Available',
  deleted_at DATETIME NULL,
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_drivers_pesel ON Drivers(pesel);
CREATE INDEX idx_drivers_status ON Drivers(status);
CREATE INDEX idx_drivers_user_id ON Drivers(user_id);
CREATE INDEX idx_drivers_deleted_at ON Drivers(deleted_at);
