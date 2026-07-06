ALTER TABLE Drivers MODIFY COLUMN status ENUM('Available', 'OnLeave', 'InRoute') DEFAULT 'Available';
