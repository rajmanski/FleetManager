package auth

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AuditUserContextMiddleware(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rawUserID, exists := c.Get(ContextUserIDKey)
		if !exists {
			c.Next()
			return
		}

		userID, ok := rawUserID.(int32)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid auth context"})
			return
		}

		if _, err := db.ExecContext(c.Request.Context(), "SET @current_user_id = ?", userID); err != nil {
			log.Printf("audit middleware: failed to set @current_user_id=%d: %v", userID, err)
		} else {
			defer func() {
				if _, err := db.ExecContext(c.Request.Context(), "SET @current_user_id = NULL"); err != nil {
					log.Printf("audit middleware: failed to clear @current_user_id: %v", err)
				}
			}()
		}

		c.Next()
	}
}
