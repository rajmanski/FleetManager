CREATE TABLE Roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255)
);

INSERT INTO Roles (role_name, description) VALUES
('Administrator', 'Pełen dostęp do systemu'),
('Spedytor', 'Zarządzanie zleceniami i trasami'),
('Mechanik', 'Zarządzanie flotą i serwisem');

CREATE TABLE Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  created_at DATETIME DEFAULT NOW(),
  is_active TINYINT(1) DEFAULT 1,
  failed_login_attempts INT DEFAULT 0,
  locked_until DATETIME NULL,
  FOREIGN KEY (role_id) REFERENCES Roles(role_id)
);

CREATE UNIQUE INDEX idx_username ON Users(username);
CREATE UNIQUE INDEX idx_email ON Users(email);
CREATE INDEX idx_role_id ON Users(role_id);
CREATE INDEX idx_locked_until ON Users(locked_until);
