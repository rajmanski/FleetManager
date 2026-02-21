ALTER TABLE Drivers
  ADD COLUMN license_number VARCHAR(50) NULL,
  ADD COLUMN license_expiry_date DATE NULL,
  ADD COLUMN adr_certified TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN adr_expiry_date DATE NULL;
