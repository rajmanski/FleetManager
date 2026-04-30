package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"fleet-management/internal/assignments"
	"fleet-management/internal/auth"
	"fleet-management/internal/cargo"
	"fleet-management/internal/changelog"
	"fleet-management/internal/clients"
	"fleet-management/internal/config"
	"fleet-management/internal/costs"
	"fleet-management/internal/dashboard"
	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/dictionaries"
	"fleet-management/internal/drivers"
	"fleet-management/internal/fuel"
	"fleet-management/internal/gdpr"
	"fleet-management/internal/insurance"
	"fleet-management/internal/maintenance"
	"fleet-management/internal/notifications"
	"fleet-management/internal/operations"
	"fleet-management/internal/orders"
	"fleet-management/internal/reports"
	"fleet-management/internal/repository"
	"fleet-management/internal/routes"
	"fleet-management/internal/scheduler"
	"fleet-management/internal/trips"
	"fleet-management/internal/users"
	"fleet-management/internal/vehicles"
	"fleet-management/internal/waypoints"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("config:", err)
	}

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	dbConn, err := sql.Open("mysql", cfg.DSN())
	if err != nil {
		log.Fatal("db open:", err)
	}
	defer dbConn.Close()

	queries := sqlc.New(dbConn)
	notificationService := notifications.NewService(queries)
	notificationHandler := notifications.NewHandler(notificationService)
	authRepository := repository.NewAuthRepository(queries)
	authService := auth.NewService(authRepository, cfg.JWTSecret)
	authHandler := auth.NewHandler(authService, cfg.IsProduction())
	usersRepository := repository.NewUsersRepository(queries)
	usersService := users.NewService(usersRepository)
	usersHandler := users.NewHandler(usersService)
	vehiclesRepository := repository.NewVehiclesRepository(queries)
	vehiclesService := vehicles.NewService(vehiclesRepository)
	vehiclesHandler := vehicles.NewHandler(vehiclesService)
	driversRepository := repository.NewDriversRepository(queries, cfg.EncryptionKey)
	gdprRepository := repository.NewGDPRRepository(dbConn, queries)
	gdprService := gdpr.NewService(gdprRepository)
	gdprHandler := gdpr.NewHandler(gdprService)
	cargoRepository := repository.NewCargoRepository(queries)
	clientsRepository := repository.NewClientsRepository(queries)
	clientsService := clients.NewService(clientsRepository)
	clientsHandler := clients.NewHandler(clientsService)
	ordersRepository := repository.NewOrdersRepository(queries)
	routesRepository := repository.NewRoutesRepository(queries)
	ordersService := orders.NewService(ordersRepository)
	ordersHandler := orders.NewHandler(ordersService)
	maintenanceRepository := repository.NewMaintenanceRepository(queries)
	maintenanceService := maintenance.NewService(maintenanceRepository)
	maintenanceHandler := maintenance.NewHandler(maintenanceService)
	insuranceRepository := repository.NewInsuranceRepository(queries)
	insuranceService := insurance.NewService(insuranceRepository)
	insuranceHandler := insurance.NewHandler(insuranceService)
	fuelRepository := repository.NewFuelRepository(dbConn)
	fuelService := fuel.NewService(fuelRepository)
	fuelHandler := fuel.NewHandler(fuelService)
	costsRepository := repository.NewCostsRepository(queries)
	costsService := costs.NewService(costsRepository)
	costsHandler := costs.NewHandler(costsService)
	reportsRepository := repository.NewReportsRepository(queries)
	reportsService := reports.NewService(reportsRepository)
	reportsHandler := reports.NewHandler(reportsService)
	dashboardRepository := repository.NewDashboardRepository(queries)
	dashboardService := dashboard.NewService(dashboardRepository)
	dashboardHandler := dashboard.NewHandler(dashboardService)
	changelogRepository := repository.NewChangelogRepository(queries)
	changelogService := changelog.NewService(changelogRepository)
	changelogHandler := changelog.NewHandler(changelogService)
	dictionariesRepository := repository.NewDictionariesRepository(queries)
	dictionariesService := dictionaries.NewService(dictionariesRepository)
	dictionariesHandler := dictionaries.NewHandler(dictionariesService)
	cargoService := cargo.NewService(cargoRepository)
	cargoHandler := cargo.NewHandler(cargoService)
	routesService := routes.NewService(cfg.GoogleMapsAPIKey)
	routesHandler := routes.NewHandler(routesService)
	waypointsRepository := repository.NewWaypointsRepository(queries)
	assignmentsRepository := repository.NewAssignmentsRepository(queries)
	assignmentsService := assignments.NewService(assignmentsRepository)
	assignmentsHandler := assignments.NewHandler(assignmentsService)
	waypointsService := waypoints.NewService(waypointsRepository, routesRepository)
	waypointsHandler := waypoints.NewHandler(waypointsService)
	driversService := drivers.NewService(driversRepository, cargoRepository, assignmentsRepository)
	driversHandler := drivers.NewHandler(driversService)
	tripsRepository := repository.NewTripsRepository(dbConn)
	tripsService := trips.NewService(tripsRepository, cargoRepository, vehiclesRepository, driversService, vehiclesService)
	tripsHandler := trips.NewHandler(tripsService)
	operationsRepository := repository.NewOperationsRepository(dbConn)
	operationsService := operations.NewService(operationsRepository)
	operationsHandler := operations.NewHandler(operationsService)

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message":   "pong",
			"deploy_ok": true,
		})
	})

	api := r.Group("/api/v1")
	api.Use(auth.AuditSystemContextMiddleware(dbConn))
	api.POST("/auth/login", authHandler.Login)
	api.POST("/auth/refresh", authHandler.Refresh)
	api.POST("/auth/logout", authHandler.Logout)

	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok and working deployment!",
		})
	})

	protected := api.Group("/")
	protected.Use(auth.JWTMiddleware(cfg.JWTSecret))
	protected.Use(auth.AuditUserContextMiddleware(dbConn))
	protected.GET(
		"/admin/users",
		auth.RBACMiddleware(auth.ResourceUsers, auth.PermissionRead),
		usersHandler.ListAdminUsers,
	)
	protected.GET(
		"/admin/users/:id",
		auth.RBACMiddleware(auth.ResourceUsers, auth.PermissionRead),
		usersHandler.GetAdminUser,
	)
	protected.POST(
		"/admin/users",
		auth.RBACMiddleware(auth.ResourceUsers, auth.PermissionWrite),
		usersHandler.CreateAdminUser,
	)
	protected.PUT(
		"/admin/users/:id",
		auth.RBACMiddleware(auth.ResourceUsers, auth.PermissionWrite),
		usersHandler.UpdateAdminUser,
	)
	protected.DELETE(
		"/admin/users/:id",
		auth.RBACMiddleware(auth.ResourceUsers, auth.PermissionWrite),
		usersHandler.DeleteAdminUser,
	)
	protected.PUT(
		"/users/:id/unlock",
		auth.RBACMiddleware(auth.ResourceUsers, auth.PermissionWrite),
		usersHandler.UnlockUser,
	)
	protected.GET(
		"/admin/changelog",
		auth.RBACMiddleware(auth.ResourceAuditLog, auth.PermissionRead),
		changelogHandler.ListAdminChangelog,
	)
	protected.GET(
		"/admin/dictionaries",
		auth.RBACMiddleware(auth.ResourceDictionaries, auth.PermissionRead),
		dictionariesHandler.List,
	)
	protected.POST(
		"/admin/dictionaries",
		auth.RBACMiddleware(auth.ResourceDictionaries, auth.PermissionWrite),
		dictionariesHandler.Create,
	)
	protected.PUT(
		"/admin/dictionaries/:id",
		auth.RBACMiddleware(auth.ResourceDictionaries, auth.PermissionWrite),
		dictionariesHandler.Update,
	)
	protected.DELETE(
		"/admin/dictionaries/:id",
		auth.RBACMiddleware(auth.ResourceDictionaries, auth.PermissionWrite),
		dictionariesHandler.Delete,
	)
	protected.DELETE(
		"/admin/gdpr/forget-driver/:id",
		auth.RBACMiddleware(auth.ResourceGDPR, auth.PermissionWrite),
		gdprHandler.ForgetDriver,
	)
	protected.GET(
		"/changelog",
		auth.RBACMiddleware(auth.ResourceAuditLog, auth.PermissionRead),
		changelogHandler.ListAdminChangelog,
	)
	protected.GET(
		"/vehicles",
		auth.RBACMiddleware(auth.ResourceVehicles, auth.PermissionRead),
		vehiclesHandler.ListVehicles,
	)
	protected.GET(
		"/vehicles/:id",
		auth.RBACMiddleware(auth.ResourceVehicles, auth.PermissionRead),
		vehiclesHandler.GetVehicle,
	)
	protected.POST(
		"/vehicles",
		auth.RBACMiddleware(auth.ResourceVehicles, auth.PermissionWrite),
		vehiclesHandler.CreateVehicle,
	)
	protected.PUT(
		"/vehicles/:id",
		auth.RBACMiddleware(auth.ResourceVehicles, auth.PermissionWrite),
		vehiclesHandler.UpdateVehicle,
	)
	protected.DELETE(
		"/vehicles/:id",
		auth.RBACMiddleware(auth.ResourceVehicles, auth.PermissionWrite),
		vehiclesHandler.DeleteVehicle,
	)
	protected.PATCH(
		"/vehicles/:id/status",
		auth.RBACMiddleware(auth.ResourceVehicles, auth.PermissionWrite),
		vehiclesHandler.UpdateVehicleStatus,
	)
	protected.PUT(
		"/vehicles/:id/restore",
		auth.RBACMiddleware(auth.ResourceVehicles, auth.PermissionWrite),
		vehiclesHandler.RestoreVehicle,
	)
	protected.GET(
		"/vehicles/:id/availability",
		auth.RBACMiddleware(auth.ResourceVehicles, auth.PermissionRead),
		vehiclesHandler.GetVehicleAvailability,
	)
	protected.GET(
		"/vehicles/:id/assignment-history",
		auth.RBACMiddleware(auth.ResourceVehicles, auth.PermissionRead),
		assignmentsHandler.GetVehicleAssignmentHistory,
	)
	protected.GET(
		"/vehicles/:id/maintenance-history",
		auth.RBACMiddleware(auth.ResourceMaintenancePolicy, auth.PermissionRead),
		vehiclesHandler.GetVehicleMaintenanceHistory,
	)
	protected.GET(
		"/drivers",
		auth.RBACMiddleware(auth.ResourceDrivers, auth.PermissionRead),
		driversHandler.ListDrivers,
	)
	protected.GET(
		"/drivers/:id",
		auth.RBACMiddleware(auth.ResourceDrivers, auth.PermissionRead),
		driversHandler.GetDriver,
	)
	protected.POST(
		"/drivers",
		auth.RBACMiddleware(auth.ResourceDrivers, auth.PermissionWrite),
		driversHandler.CreateDriver,
	)
	protected.PUT(
		"/drivers/:id",
		auth.RBACMiddleware(auth.ResourceDrivers, auth.PermissionWrite),
		driversHandler.UpdateDriver,
	)
	protected.DELETE(
		"/drivers/:id",
		auth.RBACMiddleware(auth.ResourceDrivers, auth.PermissionWrite),
		driversHandler.DeleteDriver,
	)
	protected.PUT(
		"/drivers/:id/restore",
		auth.RBACMiddleware(auth.ResourceDrivers, auth.PermissionWrite),
		driversHandler.RestoreDriver,
	)
	protected.GET(
		"/drivers/:id/availability",
		auth.RBACMiddleware(auth.ResourceDrivers, auth.PermissionRead),
		driversHandler.GetDriverAvailability,
	)
	protected.GET(
		"/drivers/:id/assignment-history",
		auth.RBACMiddleware(auth.ResourceDrivers, auth.PermissionRead),
		assignmentsHandler.GetDriverAssignmentHistory,
	)
	protected.GET(
		"/drivers/:id/can-transport-hazardous",
		auth.RBACMiddleware(auth.ResourceDrivers, auth.PermissionRead),
		driversHandler.CanDriverTransportHazardous,
	)
	protected.GET(
		"/clients",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionRead),
		clientsHandler.ListClients,
	)
	protected.GET(
		"/clients/:id",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionRead),
		clientsHandler.GetClient,
	)
	protected.POST(
		"/clients",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionWrite),
		clientsHandler.CreateClient,
	)
	protected.PUT(
		"/clients/:id",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionWrite),
		clientsHandler.UpdateClient,
	)
	protected.DELETE(
		"/clients/:id",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionWrite),
		clientsHandler.DeleteClient,
	)
	protected.PUT(
		"/clients/:id/restore",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionWrite),
		clientsHandler.RestoreClient,
	)
	protected.GET(
		"/orders",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionRead),
		ordersHandler.ListOrders,
	)
	protected.GET(
		"/orders/:id",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionRead),
		ordersHandler.GetOrder,
	)
	protected.GET(
		"/orders/:id/trips",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionRead),
		tripsHandler.ListTripsByOrder,
	)
	protected.POST(
		"/orders",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionWrite),
		ordersHandler.CreateOrder,
	)
	protected.PUT(
		"/orders/:id",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionWrite),
		ordersHandler.UpdateOrder,
	)
	protected.DELETE(
		"/orders/:id",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionWrite),
		ordersHandler.DeleteOrder,
	)
	protected.GET(
		"/orders/:id/cargo",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionRead),
		cargoHandler.ListCargo,
	)
	protected.POST(
		"/orders/:id/cargo",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionWrite),
		cargoHandler.CreateCargo,
	)
	protected.GET(
		"/cargo/:id",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionRead),
		cargoHandler.GetCargo,
	)
	protected.PUT(
		"/cargo/:id",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionWrite),
		cargoHandler.UpdateCargo,
	)
	protected.PUT(
		"/cargo/:id/assign-waypoint",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionWrite),
		cargoHandler.AssignWaypoint,
	)
	protected.DELETE(
		"/cargo/:id",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionWrite),
		cargoHandler.DeleteCargo,
	)
	protected.POST(
		"/routes/geocode",
		auth.RBACMiddleware(auth.ResourceRoutes, auth.PermissionRead),
		routesHandler.Geocode,
	)
	protected.POST(
		"/routes/calculate",
		auth.RBACMiddleware(auth.ResourceRoutes, auth.PermissionRead),
		routesHandler.Calculate,
	)
	protected.GET(
		"/routes/:route_id/waypoints",
		auth.RBACMiddleware(auth.ResourceRoutes, auth.PermissionRead),
		waypointsHandler.ListWaypoints,
	)
	protected.POST(
		"/routes/:route_id/waypoints",
		auth.RBACMiddleware(auth.ResourceRoutes, auth.PermissionWrite),
		waypointsHandler.CreateWaypoint,
	)
	protected.PATCH(
		"/waypoints/reorder",
		auth.RBACMiddleware(auth.ResourceRoutes, auth.PermissionWrite),
		waypointsHandler.ReorderWaypoints,
	)
	protected.PUT(
		"/waypoints/:id",
		auth.RBACMiddleware(auth.ResourceRoutes, auth.PermissionWrite),
		waypointsHandler.UpdateWaypoint,
	)
	protected.DELETE(
		"/waypoints/:id",
		auth.RBACMiddleware(auth.ResourceRoutes, auth.PermissionWrite),
		waypointsHandler.DeleteWaypoint,
	)
	protected.GET(
		"/assignments",
		auth.RBACMiddleware(auth.ResourceAssignments, auth.PermissionRead),
		assignmentsHandler.ListAssignments,
	)
	protected.POST(
		"/assignments",
		auth.RBACMiddleware(auth.ResourceAssignments, auth.PermissionWrite),
		assignmentsHandler.CreateAssignment,
	)
	protected.PUT(
		"/assignments/:id/end",
		auth.RBACMiddleware(auth.ResourceAssignments, auth.PermissionWrite),
		assignmentsHandler.EndAssignment,
	)

	protected.GET(
		"/trips",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionRead),
		tripsHandler.ListTrips,
	)
	protected.GET(
		"/trips/:id",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionRead),
		tripsHandler.GetTrip,
	)
	protected.POST(
		"/trips",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionWrite),
		tripsHandler.CreateTrip,
	)
	protected.POST(
		"/operations/orders/plan",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionWrite),
		operationsHandler.CreatePlannedOrderWorkflow,
	)
	protected.PATCH(
		"/trips/:id/start",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionWrite),
		tripsHandler.StartTrip,
	)
	protected.PATCH(
		"/trips/:id/finish",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionWrite),
		tripsHandler.FinishTrip,
	)
	protected.PATCH(
		"/trips/:id/abort",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionWrite),
		tripsHandler.AbortTrip,
	)

	protected.GET(
		"/maintenance",
		auth.RBACMiddleware(auth.ResourceMaintenancePolicy, auth.PermissionRead),
		maintenanceHandler.ListMaintenance,
	)
	protected.GET(
		"/maintenance/:id",
		auth.RBACMiddleware(auth.ResourceMaintenancePolicy, auth.PermissionRead),
		maintenanceHandler.GetMaintenance,
	)
	protected.POST(
		"/maintenance",
		auth.RBACMiddleware(auth.ResourceMaintenancePolicy, auth.PermissionWrite),
		maintenanceHandler.CreateMaintenance,
	)
	protected.PUT(
		"/maintenance/:id",
		auth.RBACMiddleware(auth.ResourceMaintenancePolicy, auth.PermissionWrite),
		maintenanceHandler.UpdateMaintenance,
	)
	protected.PATCH(
		"/maintenance/:id/status",
		auth.RBACMiddleware(auth.ResourceMaintenancePolicy, auth.PermissionWrite),
		maintenanceHandler.UpdateMaintenanceStatus,
	)

	protected.GET(
		"/insurance",
		auth.RBACMiddleware(auth.ResourceMaintenancePolicy, auth.PermissionRead),
		insuranceHandler.ListInsurancePolicies,
	)
	protected.GET(
		"/insurance/:id",
		auth.RBACMiddleware(auth.ResourceMaintenancePolicy, auth.PermissionRead),
		insuranceHandler.GetInsurancePolicy,
	)
	protected.POST(
		"/insurance",
		auth.RBACMiddleware(auth.ResourceMaintenancePolicy, auth.PermissionWrite),
		insuranceHandler.CreateInsurancePolicy,
	)
	protected.PUT(
		"/insurance/:id",
		auth.RBACMiddleware(auth.ResourceMaintenancePolicy, auth.PermissionWrite),
		insuranceHandler.UpdateInsurancePolicy,
	)
	protected.DELETE(
		"/insurance/:id",
		auth.RBACMiddleware(auth.ResourceMaintenancePolicy, auth.PermissionWrite),
		insuranceHandler.DeleteInsurancePolicy,
	)

	protected.POST(
		"/fuel",
		auth.RBACMiddleware(auth.ResourceCostsFuel, auth.PermissionWrite),
		fuelHandler.CreateFuelLog,
	)

	protected.GET(
		"/fuel",
		auth.RBACMiddleware(auth.ResourceCostsFuel, auth.PermissionRead),
		fuelHandler.ListFuelLogs,
	)
	protected.GET(
		"/costs",
		auth.RBACMiddleware(auth.ResourceCostsFuel, auth.PermissionRead),
		costsHandler.ListCosts,
	)
	protected.POST(
		"/costs",
		auth.RBACMiddleware(auth.ResourceCostsFuel, auth.PermissionWrite),
		costsHandler.CreateCost,
	)
	protected.PUT(
		"/costs/:id",
		auth.RBACMiddleware(auth.ResourceCostsFuel, auth.PermissionWrite),
		costsHandler.UpdateCost,
	)
	protected.DELETE(
		"/costs/:id",
		auth.RBACMiddleware(auth.ResourceCostsFuel, auth.PermissionWrite),
		costsHandler.DeleteCost,
	)
	protected.GET(
		"/reports/vehicle-profitability/export",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionRead),
		reportsHandler.ExportVehicleProfitability,
	)
	protected.GET(
		"/reports/vehicle-profitability",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionRead),
		reportsHandler.GetVehicleProfitability,
	)
	protected.GET(
		"/reports/driver-mileage",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionRead),
		reportsHandler.GetDriverMileage,
	)
	protected.GET(
		"/reports/global-costs",
		auth.RBACMiddleware(auth.ResourceOrders, auth.PermissionRead),
		reportsHandler.GetGlobalCosts,
	)
	protected.GET("/dashboard/kpi", dashboardHandler.GetKPI)

	protected.GET("/notifications", notificationHandler.ListNotifications)
	protected.PATCH("/notifications/:id/read", notificationHandler.MarkNotificationRead)

	protected.GET("/db-check", func(c *gin.Context) {
		var one int
		if err := dbConn.QueryRow("SELECT 1").Scan(&one); err != nil || one != 1 {
			c.JSON(500, gin.H{
				"status": "error",
				"error":  "database check failed",
			})
			return
		}

		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	srv := &http.Server{
		Addr:    ":" + cfg.ServerPort,
		Handler: r,
	}

	var cronSched *scheduler.Scheduler
	var cronStarted bool
	if cfg.NotificationSchedulerEnabled {
		cronSched = scheduler.New()
		if err := scheduler.RegisterDueTermNotifications(
			cronSched,
			notificationService,
			cfg.NotificationSchedulerCron,
			cfg.NotificationLookaheadDays,
		); err != nil {
			log.Printf("notification scheduler: invalid cron %q: %v", cfg.NotificationSchedulerCron, err)
		} else {
			cronSched.Start()
			cronStarted = true
			log.Printf(
				"notification scheduler: started (cron=%q lookahead_days=%d)",
				cfg.NotificationSchedulerCron,
				cfg.NotificationLookaheadDays,
			)
		}
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server listen: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("server: shutdown signal received")

	if cronStarted && cronSched != nil {
		log.Println("scheduler: stopping")
		<-cronSched.Stop().Done()
		log.Println("scheduler: stopped")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("server: shutdown error: %v", err)
	}
	log.Println("server: stopped")
}
