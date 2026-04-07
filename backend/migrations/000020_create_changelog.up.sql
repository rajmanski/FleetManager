CREATE TABLE Changelog (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id INT NOT NULL,
  operation ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  old_data JSON NULL,
  new_data JSON NULL,
  timestamp DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE INDEX idx_changelog_user_id ON Changelog(user_id);
CREATE INDEX idx_changelog_table_name ON Changelog(table_name);
CREATE INDEX idx_changelog_operation ON Changelog(operation);
CREATE INDEX idx_changelog_timestamp ON Changelog(timestamp);
