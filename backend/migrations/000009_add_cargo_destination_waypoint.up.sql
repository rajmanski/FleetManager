ALTER TABLE Cargo
ADD COLUMN destination_waypoint_id INT NULL,
ADD CONSTRAINT fk_cargo_destination_waypoint
  FOREIGN KEY (destination_waypoint_id) REFERENCES RouteWaypoints(waypoint_id) ON DELETE SET NULL;

CREATE INDEX idx_cargo_destination_waypoint ON Cargo(destination_waypoint_id);
