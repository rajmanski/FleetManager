CREATE TABLE Cargo (
  cargo_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  description TEXT,
  weight_kg DECIMAL(10,2),
  volume_m3 DECIMAL(10,2),
  cargo_type ENUM('General', 'Refrigerated', 'Hazardous') DEFAULT 'General',
  FOREIGN KEY (order_id) REFERENCES Orders(order_id)
);

CREATE INDEX idx_cargo_order_id ON Cargo(order_id);
CREATE INDEX idx_cargo_type ON Cargo(cargo_type);
