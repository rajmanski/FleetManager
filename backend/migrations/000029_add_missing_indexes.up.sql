-- Idempotent index creation: skips indexes that already exist (safe for retry after partial failure)
CREATE PROCEDURE IF NOT EXISTS tmp_create_index_if_not_exists(
    IN tbl VARCHAR(128),
    IN idx_name VARCHAR(128),
    IN idx_cols TEXT
)
BEGIN
    DECLARE idx_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO idx_exists
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = tbl
      AND index_name = idx_name;
    IF idx_exists = 0 THEN
        SET @sql = CONCAT('CREATE INDEX ', idx_name, ' ON ', tbl, ' (', idx_cols, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END;

CALL tmp_create_index_if_not_exists('Vehicles',        'idx_vehicles_deleted_at',          'deleted_at');
CALL tmp_create_index_if_not_exists('Vehicles',        'idx_vehicles_plate_number',        'plate_number');
CALL tmp_create_index_if_not_exists('Drivers',         'idx_drivers_adr_expiry',           'adr_expiry_date');
CALL tmp_create_index_if_not_exists('Drivers',         'idx_drivers_license_expiry',       'license_expiry_date');
CALL tmp_create_index_if_not_exists('InsurancePolicy', 'idx_InsurancePolicy_vehicle_id',    'vehicle_id');
CALL tmp_create_index_if_not_exists('InsurancePolicy', 'idx_InsurancePolicy_end_date',      'end_date');
CALL tmp_create_index_if_not_exists('Maintenance',     'idx_maintenance_dates',             'start_date, end_date');
CALL tmp_create_index_if_not_exists('RouteWaypoints',  'idx_route_waypoints_route_seq',     'route_id, sequence_order');

DROP PROCEDURE IF EXISTS tmp_create_index_if_not_exists;
