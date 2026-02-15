package main

import (
	"database/sql"
	"log"

	"fleet-management/internal/auth"
	"fleet-management/internal/config"
	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/repository"
	"fleet-management/internal/users"

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
