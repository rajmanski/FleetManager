CREATE TABLE Routes (
  route_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  start_location VARCHAR(500),
  end_location VARCHAR(500),
  planned_distance_km DECIMAL(10,2),
  estimated_time_min INT,
  FOREIGN KEY (order_id) REFERENCES Orders(order_id)
);

CREATE INDEX idx_routes_order_id ON Routes(order_id);

CREATE TABLE RouteWaypoints (
  waypoint_id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT NOT NULL,
  sequence_order INT NOT NULL,
  address VARCHAR(500) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  action_type ENUM('Pickup', 'Dropoff', 'Stopover') NOT NULL DEFAULT 'Stopover',
  FOREIGN KEY (route_id) REFERENCES Routes(route_id) ON DELETE CASCADE
);

CREATE INDEX idx_route_waypoints_route_id ON RouteWaypoints(route_id);
CREATE INDEX idx_route_waypoints_sequence ON RouteWaypoints(route_id, sequence_order);
