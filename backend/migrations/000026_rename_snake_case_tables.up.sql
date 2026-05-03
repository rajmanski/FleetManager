-- Conditionally rename snake_case tables to PascalCase.
-- Safe for both fresh deployments (no-op) and production upgrades.

CREATE PROCEDURE IF NOT EXISTS tmp_rename_if_exists(
    IN old_name VARCHAR(128),
    IN new_name VARCHAR(128)
)
BEGIN
    DECLARE tbl_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO tbl_exists
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = old_name;
    IF tbl_exists > 0 THEN
        SET @sql = CONCAT('RENAME TABLE `', old_name, '` TO `', new_name, '`');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END;

CALL tmp_rename_if_exists('fuel_logs',          'FuelLog');
CALL tmp_rename_if_exists('insurance_policies', 'InsurancePolicy');
CALL tmp_rename_if_exists('costs',              'Cost');
CALL tmp_rename_if_exists('notifications',      'Notification');

DROP PROCEDURE IF EXISTS tmp_rename_if_exists;
