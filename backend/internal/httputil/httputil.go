package httputil

import (
	"log"
	"strconv"

	"github.com/gin-gonic/gin"
)

func RespondError(c *gin.Context, httpStatus int, err error, userMsg string) {
	log.Printf("[%d] %s: %s: %v", httpStatus, c.FullPath(), userMsg, err)
	c.JSON(httpStatus, gin.H{"error": err.Error()})
}

func ParsePositiveInt64Param(c *gin.Context, name string) (int64, error) {
	value := c.Param(name)
	id, err := strconv.ParseInt(value, 10, 64)
	if err != nil || id <= 0 {
		return 0, ErrInvalidParam
	}
	return id, nil
}

func ParsePositiveInt64Query(c *gin.Context, key string) (int64, bool) {
	value, err := strconv.ParseInt(c.Query(key), 10, 64)
	if err != nil || value <= 0 {
		return 0, false
	}
	return value, true
}

var ErrInvalidParam = &InvalidParamError{}

type InvalidParamError struct{}

func (*InvalidParamError) Error() string { return "invalid param" }
