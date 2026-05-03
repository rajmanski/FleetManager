DROP INDEX idx_vehicles_deleted_at ON Vehicles;
DROP INDEX idx_vehicles_plate_number ON Vehicles;
DROP INDEX idx_drivers_adr_expiry ON Drivers;
DROP INDEX idx_drivers_license_expiry ON Drivers;
DROP INDEX idx_InsurancePolicy_vehicle_id ON InsurancePolicy;
DROP INDEX idx_InsurancePolicy_end_date ON InsurancePolicy;
DROP INDEX idx_maintenance_dates ON Maintenance;
DROP INDEX idx_route_waypoints_route_seq ON RouteWaypoints;
