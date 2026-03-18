ALTER TABLE Vehicles
  ADD COLUMN next_inspection_date DATE NULL;

CREATE INDEX idx_vehicles_next_inspection_date ON Vehicles(next_inspection_date);

DROP TRIGGER IF EXISTS trg_maintenance_set_next_inspection_date;
CREATE TRIGGER trg_maintenance_set_next_inspection_date
AFTER UPDATE ON Maintenance
FOR EACH ROW
BEGIN
  IF NEW.status = 'Completed'
     AND OLD.status <> 'Completed'
     AND NEW.type = 'Routine'
     AND NEW.end_date IS NOT NULL THEN
    UPDATE Vehicles
    SET next_inspection_date = DATE_ADD(DATE(NEW.end_date), INTERVAL 1 YEAR)
    WHERE vehicle_id = NEW.vehicle_id;
  END IF;
END;
