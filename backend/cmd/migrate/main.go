package main

import (
	"errors"
	"flag"
	"fmt"
	"log"

	"fleet-management/internal/config"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	direction := flag.String("direction", "up", "Migration direction: up or down")
	steps := flag.Int("steps", 0, "Number of steps (0 means all pending for up, one step for down)")
	forceVersion := flag.Int("force_version", -1, "Force schema_migrations version (use to recover from dirty state)")
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		log.Fatal("config:", err)
	}

	m, err := migrate.New("file://migrations", cfg.MigrateURL())
	if err != nil {
		log.Fatal("migrate init:", err)
	}
	defer func() {
		sourceErr, dbErr := m.Close()
		if sourceErr != nil {
			log.Printf("migrate source close error: %v", sourceErr)
		}
		if dbErr != nil {
			log.Printf("migrate database close error: %v", dbErr)
		}
	}()

	if *forceVersion >= 0 {
		if err := m.Force(*forceVersion); err != nil {
			log.Fatal("migrate force:", err)
		}
	}

	switch *direction {
	case "up":
		if err := runUp(m, *steps); err != nil {
			log.Fatal("migrate up:", err)
		}
	case "down":
		if err := runDown(m, *steps); err != nil {
			log.Fatal("migrate down:", err)
		}
	default:
		log.Fatalf("unsupported direction %q (expected: up or down)", *direction)
	}

	version, dirty, err := m.Version()
	if err != nil {
		if errors.Is(err, migrate.ErrNilVersion) {
			fmt.Println("migration version: none")
			return
		}
		log.Fatal("migrate version:", err)
	}

	fmt.Printf("migration version: %d (dirty=%t)\n", version, dirty)
}

func runUp(m *migrate.Migrate, steps int) error {
	if steps > 0 {
		if err := m.Steps(steps); err != nil && !errors.Is(err, migrate.ErrNoChange) {
			return err
		}
		return nil
	}

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return err
	}
	return nil
}

func runDown(m *migrate.Migrate, steps int) error {
	if steps > 0 {
		if err := m.Steps(-steps); err != nil && !errors.Is(err, migrate.ErrNoChange) {
			return err
		}
		return nil
	}

	if err := m.Steps(-1); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return err
	}
	return nil
}
