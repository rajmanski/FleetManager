package main

import (
	"database/sql"
	"log"

	"fleet-management/internal/auth"
	"fleet-management/internal/config"
	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/repository"

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
	r.Use(cors.Default())

	dbConn, err := sql.Open("mysql", cfg.DSN())
	if err != nil {
		log.Fatal("db open:", err)
	}
	defer dbConn.Close()

	queries := sqlc.New(dbConn)
	authRepository := repository.NewAuthRepository(queries)
	authService := auth.NewService(authRepository, cfg.JWTSecret)
	authHandler := auth.NewHandler(authService, cfg.IsProduction())

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	api := r.Group("/api/v1")
	api.POST("/auth/login", authHandler.Login)
	api.POST("/auth/refresh", authHandler.Refresh)

	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	protected := api.Group("/")
	protected.Use(auth.JWTMiddleware(cfg.JWTSecret))
	protected.PUT(
		"/users/:id/unlock",
		auth.RBACMiddleware(auth.ResourceUsers, auth.PermissionWrite),
		authHandler.UnlockUser,
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
