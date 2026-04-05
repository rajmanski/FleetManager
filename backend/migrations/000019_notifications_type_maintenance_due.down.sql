ALTER TABLE notifications
MODIFY COLUMN type ENUM(
  'Insurance_Expiry',
  'Inspection_Due',
  'Certificate_Expiry',
  'Fuel_Anomaly'
) NOT NULL;
