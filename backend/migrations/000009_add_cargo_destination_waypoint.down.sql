ALTER TABLE Cargo
DROP FOREIGN KEY fk_cargo_destination_waypoint,
DROP INDEX idx_cargo_destination_waypoint,
DROP COLUMN destination_waypoint_id;
