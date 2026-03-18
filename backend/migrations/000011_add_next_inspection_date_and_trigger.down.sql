DROP TRIGGER IF EXISTS trg_maintenance_set_next_inspection_date;

DROP INDEX idx_vehicles_next_inspection_date ON Vehicles;

ALTER TABLE Vehicles
  DROP COLUMN next_inspection_date;
