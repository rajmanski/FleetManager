package main

import (
	"database/sql"
	"log"

	"fleet-management/internal/auth"
	"fleet-management/internal/clients"
	"fleet-management/internal/config"
	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/drivers"
	"fleet-management/internal/repository"
	"fleet-management/internal/routes"
	"fleet-management/internal/users"
	"fleet-management/internal/cargo"
	"fleet-management/internal/orders"
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
	cargoRepository := repository.NewCargoRepository(queries)
	driversService := drivers.NewService(driversRepository, cargoRepository)
	driversHandler := drivers.NewHandler(driversService)
	clientsRepository := repository.NewClientsRepository(queries)
	clientsService := clients.NewService(clientsRepository)
	clientsHandler := clients.NewHandler(clientsService)
	ordersRepository := repository.NewOrdersRepository(queries)
	routesRepository := repository.NewRoutesRepository(queries)
	ordersService := orders.NewService(ordersRepository)
	ordersHandler := orders.NewHandler(ordersService)
	cargoService := cargo.NewService(cargoRepository)
	cargoHandler := cargo.NewHandler(cargoService)
	routesService := routes.NewService(cfg.GoogleMapsAPIKey)
	routesHandler := routes.NewHandler(routesService)
	waypointsRepository := repository.NewWaypointsRepository(queries)
	waypointsService := waypoints.NewService(waypointsRepository, routesRepository)
	waypointsHandler := waypoints.NewHandler(waypointsService)

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	api := r.Group("/api/v1")
	api.POST("/auth/login", authHandler.Login)
	api.POST("/auth/refresh", authHandler.Refresh)
	api.POST("/auth/logout", authHandler.Logout)

	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	protected := api.Group("/")
	protected.Use(auth.JWTMiddleware(cfg.JWTSecret))
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

	log.Fatal(r.Run(":" + cfg.ServerPort))
}
