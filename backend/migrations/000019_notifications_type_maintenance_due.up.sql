ALTER TABLE Notification
MODIFY COLUMN type ENUM(
  'Insurance_Expiry',
  'Inspection_Due',
  'Certificate_Expiry',
  'Fuel_Anomaly',
  'Maintenance_Due'
) NOT NULL;
