CREATE TABLE Dictionaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(64) NOT NULL,
  `key` VARCHAR(128) NOT NULL,
  `value` VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_dictionaries_category_key (category, `key`),
  KEY idx_dictionaries_category (category)
);
