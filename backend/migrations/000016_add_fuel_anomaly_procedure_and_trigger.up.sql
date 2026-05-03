DROP PROCEDURE IF EXISTS sp_detect_fuel_anomaly;
CREATE PROCEDURE sp_detect_fuel_anomaly(IN p_log_id INT)
proc: BEGIN
  DECLARE v_vehicle_id INT;
  DECLARE v_liters DECIMAL(10,2);
  DECLARE v_mileage INT;
  DECLARE v_prev_mileage INT;
  DECLARE v_current_consumption DECIMAL(10,4);
  DECLARE v_avg_consumption DECIMAL(10,4);
  DECLARE v_deviation_percent DECIMAL(10,4);

  SELECT vehicle_id, liters, mileage
  INTO v_vehicle_id, v_liters, v_mileage
  FROM FuelLog
  WHERE id = p_log_id
  LIMIT 1;

  IF v_vehicle_id IS NULL THEN
    LEAVE proc;
  END IF;

  SELECT mileage
  INTO v_prev_mileage
  FROM FuelLog
  WHERE vehicle_id = v_vehicle_id
    AND id <> p_log_id
    AND (
      date < (SELECT date FROM FuelLog WHERE id = p_log_id)
      OR (date = (SELECT date FROM FuelLog WHERE id = p_log_id) AND id < p_log_id)
    )
  ORDER BY date DESC, id DESC
  LIMIT 1;

  IF v_prev_mileage IS NULL OR v_mileage <= v_prev_mileage THEN
    LEAVE proc;
  END IF;

  SET v_current_consumption = (v_liters / (v_mileage - v_prev_mileage)) * 100;

  SELECT AVG(consumption)
  INTO v_avg_consumption
  FROM (
    SELECT
      (f.liters / (f.mileage - p.prev_mileage)) * 100 AS consumption
    FROM FuelLog f
    JOIN (
      SELECT
        fl.id,
        (
          SELECT fl2.mileage
          FROM FuelLog fl2
          WHERE fl2.vehicle_id = fl.vehicle_id
            AND (
              fl2.date < fl.date
              OR (fl2.date = fl.date AND fl2.id < fl.id)
            )
          ORDER BY fl2.date DESC, fl2.id DESC
          LIMIT 1
        ) AS prev_mileage
      FROM FuelLog fl
      WHERE fl.vehicle_id = v_vehicle_id
    ) p ON p.id = f.id
    WHERE p.prev_mileage IS NOT NULL
      AND f.mileage > p.prev_mileage
  ) t;

  IF v_avg_consumption IS NULL OR v_avg_consumption <= 0 THEN
    LEAVE proc;
  END IF;

  SET v_deviation_percent = ABS(v_current_consumption - v_avg_consumption) / v_avg_consumption * 100;

  IF v_deviation_percent > 20 THEN
    INSERT INTO Alerts (vehicle_id, fuel_log_id, alert_type, message, is_resolved)
    VALUES (
      v_vehicle_id,
      p_log_id,
      'fuel_anomaly',
      CONCAT(
        'Abnormal fuel consumption detected: ',
        ROUND(v_current_consumption, 1), ' l/100km (avg: ',
        ROUND(v_avg_consumption, 1), ' l/100km, +',
        ROUND(v_deviation_percent, 1), '%)'
      ),
      0
    );
  END IF;
END;

DROP TRIGGER IF EXISTS trg_FuelLog_detect_anomaly;
CREATE TRIGGER trg_FuelLog_detect_anomaly
AFTER INSERT ON FuelLog
FOR EACH ROW
BEGIN
  CALL sp_detect_fuel_anomaly(NEW.id);
END;
