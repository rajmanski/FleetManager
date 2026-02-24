package config

import (
	"encoding/base64"
	"fmt"
	"os"
)

const aes256KeyLen = 32

type Config struct {
	ServerPort       string
	DBHost           string
	DBPort           string
	DBUser           string
	DBPassword       string
	DBName           string
	JWTSecret        string
	AppEnv           string
	EncryptionKey    []byte
	GoogleMapsAPIKey string
}

func Load() (*Config, error) {
	cfg := &Config{
		ServerPort:       getEnv("SERVER_PORT", "8080"),
		DBHost:           getEnv("DB_HOST", "localhost"),
		DBPort:           getEnv("DB_PORT", "3306"),
		DBUser:           getEnv("DB_USER", "root"),
		DBPassword:       getEnv("DB_PASSWORD", ""),
		DBName:           getEnv("DB_NAME", "fleet_management"),
		JWTSecret:        getEnv("JWT_SECRET", "change-me-jwt-secret"),
		AppEnv:           getEnv("APP_ENV", "development"),
		GoogleMapsAPIKey: getEnv("GOOGLE_MAPS_API_KEY", ""),
	}

	key, err := loadEncryptionKey()
	if err != nil {
		return nil, err
	}
	cfg.EncryptionKey = key

	return cfg, nil
}

func loadEncryptionKey() ([]byte, error) {
	raw := os.Getenv("ENCRYPTION_KEY")
	if raw == "" {
		panic("ENCRYPTION_KEY environment variable is required")
	}
	key := []byte(raw)
	if len(key) == aes256KeyLen {
		return key, nil
	}
	decoded, err := base64.StdEncoding.DecodeString(raw)
	if err != nil {
		panic(fmt.Sprintf("ENCRYPTION_KEY: invalid base64 or must be 32 raw bytes: %v", err))
	}
	if len(decoded) != aes256KeyLen {
		panic(fmt.Sprintf("ENCRYPTION_KEY must be 32 bytes, got %d", len(decoded)))
	}
	return decoded, nil
}

func (c *Config) IsProduction() bool {
	return c.AppEnv == "production"
}

func (c *Config) DSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName)
}

func (c *Config) MigrateURL() string {
	return fmt.Sprintf("mysql://%s:%s@tcp(%s:%s)/%s?multiStatements=true",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
