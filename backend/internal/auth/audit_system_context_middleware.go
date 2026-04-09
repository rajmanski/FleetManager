package auth

import (
	"database/sql"
	"log"

	"github.com/gin-gonic/gin"
)

func AuditSystemContextMiddleware(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if _, err := db.ExecContext(c.Request.Context(), "SET @current_user_id = NULL"); err != nil {
			log.Printf("audit middleware: failed to set @current_user_id=NULL: %v", err)
		}

		c.Next()
	}
}

