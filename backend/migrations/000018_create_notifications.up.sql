CREATE TABLE Notification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('Insurance_Expiry', 'Inspection_Due', 'Certificate_Expiry', 'Fuel_Anomaly') NOT NULL,
  message TEXT,
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE INDEX idx_Notification_user_id ON Notification(user_id);
CREATE INDEX idx_Notification_is_read ON Notification(is_read);
CREATE INDEX idx_Notification_created_at ON Notification(created_at);
