SET @role_admin := (SELECT role_id FROM Roles WHERE role_name = 'Administrator' LIMIT 1);
SET @role_dispatcher := (SELECT role_id FROM Roles WHERE role_name = 'Spedytor' LIMIT 1);
SET @role_mechanic := (SELECT role_id FROM Roles WHERE role_name = 'Mechanik' LIMIT 1);

INSERT INTO Users (role_id, username, password_hash, email, is_active, failed_login_attempts, locked_until)
SELECT @role_admin, 'demo_admin', '__PASSWORD_HASH__', 'demo_admin@test.local', 1, 0, NULL
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Users WHERE username = 'demo_admin');

INSERT INTO Users (role_id, username, password_hash, email, is_active, failed_login_attempts, locked_until)
SELECT @role_dispatcher, 'demo_dispatcher', '__PASSWORD_HASH__', 'demo_dispatcher@test.local', 1, 0, NULL
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Users WHERE username = 'demo_dispatcher');

INSERT INTO Users (role_id, username, password_hash, email, is_active, failed_login_attempts, locked_until)
SELECT @role_mechanic, 'demo_mechanic', '__PASSWORD_HASH__', 'demo_mechanic@test.local', 1, 0, NULL
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Users WHERE username = 'demo_mechanic');

SET @uid_admin := (SELECT user_id FROM Users WHERE username = 'demo_admin' LIMIT 1);
SET @uid_dispatcher := (SELECT user_id FROM Users WHERE username = 'demo_dispatcher' LIMIT 1);
SET @uid_mechanic := (SELECT user_id FROM Users WHERE username = 'demo_mechanic' LIMIT 1);

INSERT INTO Clients (company_name, nip, address, contact_email, deleted_at)
SELECT 'Demo Logistics Sp. z o.o.', '1111111111', 'Warsaw, Poland', 'contact@demologistics.local', NULL
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Clients WHERE nip = '1111111111');

INSERT INTO Clients (company_name, nip, address, contact_email, deleted_at)
SELECT 'FastCargo S.A.', '2222222222', 'Poznan, Poland', 'office@fastcargo.local', NULL
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Clients WHERE nip = '2222222222');

SET @client_a := (SELECT client_id FROM Clients WHERE nip = '1111111111' LIMIT 1);
SET @client_b := (SELECT client_id FROM Clients WHERE nip = '2222222222' LIMIT 1);

INSERT INTO Vehicles (
  vin, plate_number, brand, model, production_year, capacity_kg, current_mileage_km, status, deleted_at, next_inspection_date
)
SELECT 'DEMOVIN000000001', 'DW1A111', 'Volvo', 'FH', 2020, 24000, 120000, 'Available', NULL, DATE_ADD(CURDATE(), INTERVAL 10 DAY)
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Vehicles WHERE vin = 'DEMOVIN000000001');

INSERT INTO Vehicles (
  vin, plate_number, brand, model, production_year, capacity_kg, current_mileage_km, status, deleted_at, next_inspection_date
)
SELECT 'DEMOVIN000000002', 'PO2B222', 'MAN', 'TGX', 2019, 22000, 185000, 'Service', NULL, DATE_ADD(CURDATE(), INTERVAL 25 DAY)
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Vehicles WHERE vin = 'DEMOVIN000000002');

SET @veh_1 := (SELECT vehicle_id FROM Vehicles WHERE vin = 'DEMOVIN000000001' LIMIT 1);
SET @veh_2 := (SELECT vehicle_id FROM Vehicles WHERE vin = 'DEMOVIN000000002' LIMIT 1);

INSERT INTO Drivers (
  user_id, first_name, last_name, pesel, phone, email, status, deleted_at,
  license_number, license_expiry_date, adr_certified, adr_expiry_date
)
SELECT NULL, 'Jan', 'Kowalski', '__DRIVER1_PESEL_ENC__', '+48500100100', 'jan.kowalski@test.local', 'Available', NULL,
       'KR/ABC/12345', DATE_ADD(CURDATE(), INTERVAL 15 DAY), 1, DATE_ADD(CURDATE(), INTERVAL 20 DAY)
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Drivers WHERE email = 'jan.kowalski@test.local');

INSERT INTO Drivers (
  user_id, first_name, last_name, pesel, phone, email, status, deleted_at,
  license_number, license_expiry_date, adr_certified, adr_expiry_date
)
SELECT NULL, 'Anna', 'Nowak', '__DRIVER2_PESEL_ENC__', '+48500100200', 'anna.nowak@test.local', 'InRoute', NULL,
       'PO/XYZ/67890', DATE_ADD(CURDATE(), INTERVAL 40 DAY), 0, NULL
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Drivers WHERE email = 'anna.nowak@test.local');

SET @drv_1 := (SELECT driver_id FROM Drivers WHERE email = 'jan.kowalski@test.local' LIMIT 1);
SET @drv_2 := (SELECT driver_id FROM Drivers WHERE email = 'anna.nowak@test.local' LIMIT 1);

INSERT INTO Orders (client_id, order_number, creation_date, delivery_deadline, total_price_pln, status)
SELECT @client_a, 'ORD-DEMO-001', NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY), 18000.00, 'Planned'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Orders WHERE order_number = 'ORD-DEMO-001');

INSERT INTO Orders (client_id, order_number, creation_date, delivery_deadline, total_price_pln, status)
SELECT @client_b, 'ORD-DEMO-002', NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY), 24500.00, 'InProgress'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Orders WHERE order_number = 'ORD-DEMO-002');

SET @ord_1 := (SELECT order_id FROM Orders WHERE order_number = 'ORD-DEMO-001' LIMIT 1);
SET @ord_2 := (SELECT order_id FROM Orders WHERE order_number = 'ORD-DEMO-002' LIMIT 1);

INSERT INTO Routes (order_id, start_location, end_location, planned_distance_km, estimated_time_min)
SELECT @ord_1, 'Warsaw', 'Krakow', 295.0, 300
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Routes WHERE order_id = @ord_1);

INSERT INTO Routes (order_id, start_location, end_location, planned_distance_km, estimated_time_min)
SELECT @ord_2, 'Poznan', 'Gdansk', 330.0, 340
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Routes WHERE order_id = @ord_2);

SET @route_1 := (SELECT route_id FROM Routes WHERE order_id = @ord_1 LIMIT 1);
SET @route_2 := (SELECT route_id FROM Routes WHERE order_id = @ord_2 LIMIT 1);

INSERT INTO RouteWaypoints (route_id, sequence_order, address, latitude, longitude, action_type)
SELECT @route_1, 1, 'Warsaw Hub', 52.2297000, 21.0122000, 'Pickup'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM RouteWaypoints WHERE route_id = @route_1 AND sequence_order = 1
);

INSERT INTO RouteWaypoints (route_id, sequence_order, address, latitude, longitude, action_type)
SELECT @route_1, 2, 'Krakow Depot', 50.0647000, 19.9450000, 'Dropoff'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM RouteWaypoints WHERE route_id = @route_1 AND sequence_order = 2
);

INSERT INTO RouteWaypoints (route_id, sequence_order, address, latitude, longitude, action_type)
SELECT @route_2, 1, 'Poznan Terminal', 52.4064000, 16.9252000, 'Pickup'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM RouteWaypoints WHERE route_id = @route_2 AND sequence_order = 1
);

INSERT INTO RouteWaypoints (route_id, sequence_order, address, latitude, longitude, action_type)
SELECT @route_2, 2, 'Gdansk Port', 54.3520000, 18.6466000, 'Dropoff'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM RouteWaypoints WHERE route_id = @route_2 AND sequence_order = 2
);

INSERT INTO Cargo (order_id, description, weight_kg, volume_m3, cargo_type, destination_waypoint_id)
SELECT @ord_1, 'Palletized food products', 8000.00, 22.5, 'Refrigerated',
       (SELECT waypoint_id FROM RouteWaypoints WHERE route_id = @route_1 AND sequence_order = 2 LIMIT 1)
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Cargo WHERE order_id = @ord_1);

INSERT INTO Cargo (order_id, description, weight_kg, volume_m3, cargo_type, destination_waypoint_id)
SELECT @ord_2, 'Household chemicals', 12000.00, 28.0, 'Hazardous',
       (SELECT waypoint_id FROM RouteWaypoints WHERE route_id = @route_2 AND sequence_order = 2 LIMIT 1)
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Cargo WHERE order_id = @ord_2);

INSERT INTO Assignments (vehicle_id, driver_id, assigned_from, assigned_to)
SELECT @veh_1, @drv_1, DATE_SUB(NOW(), INTERVAL 2 DAY), NULL
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM Assignments WHERE vehicle_id = @veh_1 AND driver_id = @drv_1 AND assigned_to IS NULL
);

INSERT INTO Assignments (vehicle_id, driver_id, assigned_from, assigned_to)
SELECT @veh_2, @drv_2, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM Assignments WHERE vehicle_id = @veh_2 AND driver_id = @drv_2 AND assigned_to = DATE_SUB(NOW(), INTERVAL 1 DAY)
);

INSERT INTO Trips (order_id, vehicle_id, driver_id, start_time, end_time, actual_distance_km, status)
SELECT @ord_1, @veh_1, @drv_1, DATE_SUB(NOW(), INTERVAL 12 HOUR), NULL, NULL, 'Active'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Trips WHERE order_id = @ord_1 AND status = 'Active');

INSERT INTO Trips (order_id, vehicle_id, driver_id, start_time, end_time, actual_distance_km, status)
SELECT @ord_2, @veh_2, @drv_2, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 318, 'Finished'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Trips WHERE order_id = @ord_2 AND status = 'Finished');

INSERT INTO insurance_policies (vehicle_id, type, policy_number, insurer, start_date, end_date, cost)
SELECT @veh_1, 'OC', 'POL-DEMO-001', 'PZU Demo', DATE_SUB(CURDATE(), INTERVAL 100 DAY), DATE_ADD(CURDATE(), INTERVAL 18 DAY), 3100.00
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM insurance_policies WHERE policy_number = 'POL-DEMO-001');

INSERT INTO insurance_policies (vehicle_id, type, policy_number, insurer, start_date, end_date, cost)
SELECT @veh_2, 'AC', 'POL-DEMO-002', 'Warta Demo', DATE_SUB(CURDATE(), INTERVAL 80 DAY), DATE_ADD(CURDATE(), INTERVAL 45 DAY), 4200.00
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM insurance_policies WHERE policy_number = 'POL-DEMO-002');

INSERT INTO Maintenance (vehicle_id, start_date, end_date, type, status, description, labor_cost_pln, parts_cost_pln)
SELECT @veh_1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 6 DAY), '08:00:00'), NULL, 'Routine', 'Scheduled', 'Demo scheduled maintenance', 0.00, 0.00
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM Maintenance WHERE vehicle_id = @veh_1 AND description = 'Demo scheduled maintenance'
);

INSERT INTO Maintenance (vehicle_id, start_date, end_date, type, status, description, labor_cost_pln, parts_cost_pln)
SELECT @veh_2, DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), 'Repair', 'Completed', 'Demo completed repair', 1500.00, 3200.00
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM Maintenance WHERE vehicle_id = @veh_2 AND description = 'Demo completed repair'
);

INSERT INTO fuel_logs (vehicle_id, date, liters, price_per_liter, total_cost, mileage, location)
SELECT @veh_1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 120.00, 6.40, 768.00, 118500, 'Warsaw'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM fuel_logs WHERE vehicle_id = @veh_1 AND date = DATE_SUB(CURDATE(), INTERVAL 4 DAY) AND mileage = 118500
);

INSERT INTO fuel_logs (vehicle_id, date, liters, price_per_liter, total_cost, mileage, location)
SELECT @veh_1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 105.00, 6.55, 687.75, 120000, 'Krakow'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM fuel_logs WHERE vehicle_id = @veh_1 AND date = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND mileage = 120000
);

INSERT INTO fuel_logs (vehicle_id, date, liters, price_per_liter, total_cost, mileage, location)
SELECT @veh_2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 95.00, 6.50, 617.50, 184300, 'Poznan'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM fuel_logs WHERE vehicle_id = @veh_2 AND date = DATE_SUB(CURDATE(), INTERVAL 2 DAY) AND mileage = 184300
);

INSERT INTO costs (vehicle_id, category, amount, date, description, invoice_number)
SELECT @veh_1, 'Tolls', 230.00, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Highway tolls A2/A4', 'INV-DEMO-001'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM costs WHERE invoice_number = 'INV-DEMO-001');

INSERT INTO costs (vehicle_id, category, amount, date, description, invoice_number)
SELECT @veh_2, 'Other', 480.00, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Parking and washing', 'INV-DEMO-002'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM costs WHERE invoice_number = 'INV-DEMO-002');

INSERT INTO Alerts (vehicle_id, fuel_log_id, alert_type, message, is_resolved)
SELECT @veh_1, NULL, 'maintenance_due', '[SEED] Planned maintenance in 6 days', 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Alerts WHERE message = '[SEED] Planned maintenance in 6 days');

INSERT INTO Alerts (vehicle_id, fuel_log_id, alert_type, message, is_resolved)
SELECT @veh_1, NULL, 'inspection_due', '[SEED] Inspection due soon', 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Alerts WHERE message = '[SEED] Inspection due soon');

INSERT INTO Alerts (vehicle_id, fuel_log_id, alert_type, message, is_resolved)
SELECT @veh_2, NULL, 'fuel_anomaly', '[SEED] Fuel anomaly acknowledged', 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Alerts WHERE message = '[SEED] Fuel anomaly acknowledged');

INSERT INTO notifications (user_id, type, message, is_read)
SELECT @uid_mechanic, 'Insurance_Expiry', '[SEED] Insurance expires for DEMOVIN000000001', 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE message = '[SEED] Insurance expires for DEMOVIN000000001');

INSERT INTO notifications (user_id, type, message, is_read)
SELECT @uid_mechanic, 'Inspection_Due', '[SEED] Inspection due for DEMOVIN000000001', 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE message = '[SEED] Inspection due for DEMOVIN000000001');

INSERT INTO notifications (user_id, type, message, is_read)
SELECT @uid_mechanic, 'Certificate_Expiry', '[SEED] Driver license expiring: Jan Kowalski', 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE message = '[SEED] Driver license expiring: Jan Kowalski');

INSERT INTO notifications (user_id, type, message, is_read)
SELECT @uid_mechanic, 'Maintenance_Due', '[SEED] Scheduled routine maintenance approaching', 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE message = '[SEED] Scheduled routine maintenance approaching');

INSERT INTO notifications (user_id, type, message, is_read)
SELECT @uid_dispatcher, 'Fuel_Anomaly', '[SEED] Fuel anomaly detected on route', 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE message = '[SEED] Fuel anomaly detected on route');

INSERT INTO notifications (user_id, type, message, is_read)
SELECT @uid_admin, 'Insurance_Expiry', '[SEED] Admin visibility notification', 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE message = '[SEED] Admin visibility notification');

-- ---------------------------------------------------------------------------
-- Additional volume for realistic manual testing (tables, filters, pagination)
-- ---------------------------------------------------------------------------

INSERT INTO Vehicles (
  vin, plate_number, brand, model, production_year, capacity_kg, current_mileage_km, status, deleted_at, next_inspection_date
)
SELECT 'DEMOVIN000000003', 'GD3C333', 'Scania', 'R450', 2021, 25000, 98000, 'InRoute', NULL, DATE_ADD(CURDATE(), INTERVAL 5 DAY)
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Vehicles WHERE vin = 'DEMOVIN000000003');

INSERT INTO Vehicles (
  vin, plate_number, brand, model, production_year, capacity_kg, current_mileage_km, status, deleted_at, next_inspection_date
)
SELECT 'DEMOVIN000000004', 'KR4D444', 'DAF', 'XF', 2018, 21000, 240000, 'Available', NULL, DATE_ADD(CURDATE(), INTERVAL 32 DAY)
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Vehicles WHERE vin = 'DEMOVIN000000004');

SET @veh_3 := (SELECT vehicle_id FROM Vehicles WHERE vin = 'DEMOVIN000000003' LIMIT 1);
SET @veh_4 := (SELECT vehicle_id FROM Vehicles WHERE vin = 'DEMOVIN000000004' LIMIT 1);

INSERT INTO Orders (client_id, order_number, creation_date, delivery_deadline, total_price_pln, status)
SELECT @client_a, 'ORD-DEMO-003', NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), 9200.00, 'New'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Orders WHERE order_number = 'ORD-DEMO-003');

INSERT INTO Orders (client_id, order_number, creation_date, delivery_deadline, total_price_pln, status)
SELECT @client_b, 'ORD-DEMO-004', NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), 15700.00, 'Planned'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Orders WHERE order_number = 'ORD-DEMO-004');

INSERT INTO Orders (client_id, order_number, creation_date, delivery_deadline, total_price_pln, status)
SELECT @client_b, 'ORD-DEMO-005', NOW(), DATE_SUB(NOW(), INTERVAL 1 DAY), 20100.00, 'Completed'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Orders WHERE order_number = 'ORD-DEMO-005');

SET @ord_3 := (SELECT order_id FROM Orders WHERE order_number = 'ORD-DEMO-003' LIMIT 1);
SET @ord_4 := (SELECT order_id FROM Orders WHERE order_number = 'ORD-DEMO-004' LIMIT 1);
SET @ord_5 := (SELECT order_id FROM Orders WHERE order_number = 'ORD-DEMO-005' LIMIT 1);

INSERT INTO Routes (order_id, start_location, end_location, planned_distance_km, estimated_time_min)
SELECT @ord_3, 'Lodz', 'Wroclaw', 220.0, 230
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Routes WHERE order_id = @ord_3);

INSERT INTO Routes (order_id, start_location, end_location, planned_distance_km, estimated_time_min)
SELECT @ord_4, 'Szczecin', 'Warsaw', 560.0, 540
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Routes WHERE order_id = @ord_4);

INSERT INTO Trips (order_id, vehicle_id, driver_id, start_time, end_time, actual_distance_km, status)
SELECT @ord_3, @veh_3, @drv_2, NULL, NULL, NULL, 'Scheduled'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Trips WHERE order_id = @ord_3 AND status = 'Scheduled');

INSERT INTO Trips (order_id, vehicle_id, driver_id, start_time, end_time, actual_distance_km, status)
SELECT @ord_4, @veh_4, @drv_1, DATE_SUB(NOW(), INTERVAL 3 HOUR), NULL, NULL, 'Active'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Trips WHERE order_id = @ord_4 AND status = 'Active');

INSERT INTO Trips (order_id, vehicle_id, driver_id, start_time, end_time, actual_distance_km, status)
SELECT @ord_5, @veh_2, @drv_2, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), 402, 'Finished'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Trips WHERE order_id = @ord_5 AND status = 'Finished');

INSERT INTO insurance_policies (vehicle_id, type, policy_number, insurer, start_date, end_date, cost)
SELECT @veh_3, 'OC', 'POL-DEMO-003', 'Allianz Demo', DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 12 DAY), 2750.00
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM insurance_policies WHERE policy_number = 'POL-DEMO-003');

INSERT INTO insurance_policies (vehicle_id, type, policy_number, insurer, start_date, end_date, cost)
SELECT @veh_4, 'AC', 'POL-DEMO-004', 'Ergo Hestia Demo', DATE_SUB(CURDATE(), INTERVAL 45 DAY), DATE_ADD(CURDATE(), INTERVAL 60 DAY), 5200.00
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM insurance_policies WHERE policy_number = 'POL-DEMO-004');

INSERT INTO Maintenance (vehicle_id, start_date, end_date, type, status, description, labor_cost_pln, parts_cost_pln)
SELECT @veh_3, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '07:30:00'), NULL, 'TireChange', 'Scheduled', 'Demo tire change', 500.00, 900.00
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Maintenance WHERE vehicle_id = @veh_3 AND description = 'Demo tire change');

INSERT INTO Maintenance (vehicle_id, start_date, end_date, type, status, description, labor_cost_pln, parts_cost_pln)
SELECT @veh_4, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY), 'Routine', 'Completed', 'Demo completed routine service', 800.00, 1200.00
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Maintenance WHERE vehicle_id = @veh_4 AND description = 'Demo completed routine service');

INSERT INTO fuel_logs (vehicle_id, date, liters, price_per_liter, total_cost, mileage, location)
SELECT @veh_3, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 132.00, 6.42, 847.44, 96500, 'Lodz'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM fuel_logs WHERE vehicle_id = @veh_3 AND date = DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND mileage = 96500);

INSERT INTO fuel_logs (vehicle_id, date, liters, price_per_liter, total_cost, mileage, location)
SELECT @veh_3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 110.00, 6.60, 726.00, 98000, 'Wroclaw'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM fuel_logs WHERE vehicle_id = @veh_3 AND date = DATE_SUB(CURDATE(), INTERVAL 2 DAY) AND mileage = 98000);

INSERT INTO fuel_logs (vehicle_id, date, liters, price_per_liter, total_cost, mileage, location)
SELECT @veh_4, DATE_SUB(CURDATE(), INTERVAL 8 DAY), 88.00, 6.38, 561.44, 238500, 'Szczecin'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM fuel_logs WHERE vehicle_id = @veh_4 AND date = DATE_SUB(CURDATE(), INTERVAL 8 DAY) AND mileage = 238500);

INSERT INTO costs (vehicle_id, category, amount, date, description, invoice_number)
SELECT @veh_3, 'Tolls', 310.00, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'Route tolls S8/A8', 'INV-DEMO-003'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM costs WHERE invoice_number = 'INV-DEMO-003');

INSERT INTO costs (vehicle_id, category, amount, date, description, invoice_number)
SELECT @veh_3, 'Other', 140.00, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Parking fees', 'INV-DEMO-004'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM costs WHERE invoice_number = 'INV-DEMO-004');

INSERT INTO costs (vehicle_id, category, amount, date, description, invoice_number)
SELECT @veh_4, 'Tolls', 450.00, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'A6/A2 tolls', 'INV-DEMO-005'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM costs WHERE invoice_number = 'INV-DEMO-005');

INSERT INTO Alerts (vehicle_id, fuel_log_id, alert_type, message, is_resolved)
SELECT @veh_3, NULL, 'insurance_expiry', '[SEED] Insurance expiry warning for DEMOVIN000000003', 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Alerts WHERE message = '[SEED] Insurance expiry warning for DEMOVIN000000003');

INSERT INTO Alerts (vehicle_id, fuel_log_id, alert_type, message, is_resolved)
SELECT @veh_4, NULL, 'maintenance_due', '[SEED] Routine service due for DEMOVIN000000004', 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Alerts WHERE message = '[SEED] Routine service due for DEMOVIN000000004');

INSERT INTO Alerts (vehicle_id, fuel_log_id, alert_type, message, is_resolved)
SELECT @veh_3, NULL, 'inspection_due', '[SEED] Inspection due for DEMOVIN000000003', 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM Alerts WHERE message = '[SEED] Inspection due for DEMOVIN000000003');

-- High-volume notification set for filter and pagination testing (25 extra rows)
INSERT INTO notifications (user_id, type, message, is_read)
SELECT @uid_mechanic,
       CASE MOD(seq.n, 5)
         WHEN 0 THEN 'Insurance_Expiry'
         WHEN 1 THEN 'Inspection_Due'
         WHEN 2 THEN 'Certificate_Expiry'
         WHEN 3 THEN 'Maintenance_Due'
         ELSE 'Fuel_Anomaly'
       END,
       CONCAT('[SEED BULK] Notification #', LPAD(seq.n, 2, '0')),
       CASE WHEN MOD(seq.n, 4) = 0 THEN 1 ELSE 0 END
FROM (
  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
  UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
  UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
  UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
  UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25
) seq
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n
  WHERE n.message = CONCAT('[SEED BULK] Notification #', LPAD(seq.n, 2, '0'))
);

SELECT
  @uid_admin AS demo_admin_user_id,
  @uid_dispatcher AS demo_dispatcher_user_id,
  @uid_mechanic AS demo_mechanic_user_id,
  @veh_1 AS vehicle_1_id,
  @veh_2 AS vehicle_2_id,
  @veh_3 AS vehicle_3_id,
  @veh_4 AS vehicle_4_id,
  @ord_1 AS order_1_id,
  @ord_2 AS order_2_id,
  @ord_3 AS order_3_id,
  @ord_4 AS order_4_id,
  @ord_5 AS order_5_id;
