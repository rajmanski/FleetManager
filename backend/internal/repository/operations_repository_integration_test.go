package repository

import (
	"context"
	"database/sql"
	"os"
	"testing"
	"time"

	"fleet-management/internal/operations"

	_ "github.com/go-sql-driver/mysql"
)

func TestOperationsRepository_CreatesChangelogEntries(t *testing.T) {
	dsn := os.Getenv("TEST_MYSQL_DSN")
	if dsn == "" {
		t.Skip("TEST_MYSQL_DSN is not set")
	}

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	repo := NewOperationsRepository(db)

	uniqueSuffix := time.Now().UTC().Format("20060102150405")
	clientID := mustCreateIntegrationClient(t, ctx, db, uniqueSuffix)
	vehicleID := mustCreateIntegrationVehicle(t, ctx, db, uniqueSuffix)
	driverID := mustCreateIntegrationDriver(t, ctx, db, uniqueSuffix)

	req := integrationWorkflowRequest(clientID, vehicleID, driverID, "ORD-IT-"+uniqueSuffix)
	resp, err := repo.ExecutePlannedOrderWorkflowTx(ctx, req)
	if err != nil {
		t.Fatalf("execute workflow: %v", err)
	}

	var logsCount int
	err = db.QueryRowContext(
		ctx,
		`SELECT COUNT(*) FROM Changelogger WHERE table_name IN ('Orders','Routes','RouteWaypoints','Cargo','Trips') AND record_id IN (?, ?, ?)`,
		resp.Order.ID,
		resp.Route.ID,
		resp.Trip.ID,
	).Scan(&logsCount)
	if err != nil {
		t.Fatalf("query changelog: %v", err)
	}
	if logsCount == 0 {
		t.Fatalf("expected changelog entries for planned workflow, got 0")
	}
}

func integrationWorkflowRequest(clientID, vehicleID, driverID int64, orderNumber string) operations.PlanOrderWorkflowRequest {
	distance := 150.0
	eta := int32(120)
	price := 5000.0
	deadline := time.Now().AddDate(0, 0, 7).Format("2006-01-02")

	return operations.PlanOrderWorkflowRequest{
		Order: operations.PlanOrderInput{
			ClientID:         clientID,
			OrderNumber:      orderNumber,
			DeliveryDeadline: &deadline,
			TotalPricePln:    &price,
		},
		Cargo: []operations.PlanCargo{
			{
				Description: "Integration cargo",
				WeightKg:    1000,
				VolumeM3:    8,
				CargoType:   "General",
			},
		},
		Route: operations.PlanRouteInput{
			StartLocation:     "Warszawa",
			EndLocation:       "Lodz",
			PlannedDistanceKm: &distance,
			EstimatedTimeMin:  &eta,
			Waypoints: []operations.PlanWaypoint{
				{
					TempID:        "wp-1",
					SequenceOrder: 1,
					Address:       "Warszawa",
					Latitude:      52.2297,
					Longitude:     21.0122,
					ActionType:    "Pickup",
				},
			},
		},
		Trip: operations.PlanTripInput{
			VehicleID: vehicleID,
			DriverID:  driverID,
			StartTime: time.Now().Add(2 * time.Hour).UTC().Format(time.RFC3339),
		},
	}
}

func mustCreateIntegrationClient(t *testing.T, ctx context.Context, db *sql.DB, suffix string) int64 {
	t.Helper()
	res, err := db.ExecContext(
		ctx,
		`INSERT INTO Clients (company_name, nip, address, contact_email) VALUES (?, ?, ?, ?)`,
		"Client "+suffix,
		"9"+suffix[len(suffix)-9:],
		"Address "+suffix,
		"client."+suffix+"@example.com",
	)
	if err != nil {
		t.Fatalf("insert client: %v", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		t.Fatalf("client last insert id: %v", err)
	}
	return id
}

func mustCreateIntegrationVehicle(t *testing.T, ctx context.Context, db *sql.DB, suffix string) int64 {
	t.Helper()
	res, err := db.ExecContext(
		ctx,
		`INSERT INTO Vehicles (vin, plate_number, brand, model, production_year, capacity_kg, current_mileage_km, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		"VIN"+suffix[:14],
		"WX"+suffix[len(suffix)-6:],
		"TestBrand",
		"TestModel",
		2024,
		12000,
		100000,
		"Available",
	)
	if err != nil {
		t.Fatalf("insert vehicle: %v", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		t.Fatalf("vehicle last insert id: %v", err)
	}
	return id
}

func mustCreateIntegrationDriver(t *testing.T, ctx context.Context, db *sql.DB, suffix string) int64 {
	t.Helper()
	res, err := db.ExecContext(
		ctx,
		`INSERT INTO Drivers (first_name, last_name, pesel, license_number, adr_certified, status) VALUES (?, ?, ?, ?, ?, ?)`,
		"Jan",
		"Test"+suffix,
		"00000000000",
		"LIC-"+suffix,
		false,
		"Available",
	)
	if err != nil {
		t.Fatalf("insert driver: %v", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		t.Fatalf("driver last insert id: %v", err)
	}
	return id
}
