package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Permission string

const (
	PermissionRead  Permission = "R"
	PermissionWrite Permission = "W"
)

type Resource string

const (
	ResourceUsers             Resource = "Users"
	ResourceVehicles          Resource = "Vehicles"
	ResourceDrivers           Resource = "Drivers"
	ResourceOrders            Resource = "Orders"
	ResourceRoutes            Resource = "Routes"
	ResourceAssignments       Resource = "Assignments"
	ResourceMaintenancePolicy Resource = "MaintenancePolicies"
	ResourceCostsFuel         Resource = "CostsFuel"
	ResourceAuditLog          Resource = "AuditLog"
	ResourceDictionaries      Resource = "Dictionaries"
)

var permissionMatrix = map[string]map[Resource]map[Permission]bool{
	"Administrator": {
		ResourceUsers:             {PermissionRead: true, PermissionWrite: true},
		ResourceVehicles:          {PermissionRead: true, PermissionWrite: true},
		ResourceDrivers:           {PermissionRead: true, PermissionWrite: true},
		ResourceOrders:            {PermissionRead: true, PermissionWrite: true},
		ResourceRoutes:            {PermissionRead: true, PermissionWrite: true},
		ResourceAssignments:       {PermissionRead: true, PermissionWrite: true},
		ResourceMaintenancePolicy: {PermissionRead: true, PermissionWrite: true},
		ResourceCostsFuel:         {PermissionRead: true, PermissionWrite: true},
		ResourceAuditLog:          {PermissionRead: true},
		ResourceDictionaries:      {PermissionRead: true, PermissionWrite: true},
	},
	"Spedytor": {
		ResourceVehicles:          {PermissionRead: true},
		ResourceDrivers:           {PermissionRead: true},
		ResourceOrders:            {PermissionRead: true, PermissionWrite: true},
		ResourceRoutes:            {PermissionRead: true, PermissionWrite: true},
		ResourceMaintenancePolicy: {PermissionRead: true},
		ResourceCostsFuel:         {PermissionRead: true},
	},
	"Mechanik": {
		ResourceVehicles:          {PermissionRead: true, PermissionWrite: true},
		ResourceDrivers:           {PermissionRead: true, PermissionWrite: true},
		ResourceAssignments:       {PermissionRead: true, PermissionWrite: true},
		ResourceMaintenancePolicy: {PermissionRead: true, PermissionWrite: true},
		ResourceCostsFuel:         {PermissionRead: true, PermissionWrite: true},
	},
}

func RBACMiddleware(resource Resource, permission Permission) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleValue, exists := c.Get(ContextRoleKey)
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}

		role, ok := roleValue.(string)
		if !ok || !hasPermission(role, resource, permission) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}

		c.Next()
	}
}

func hasPermission(role string, resource Resource, permission Permission) bool {
	resources, roleExists := permissionMatrix[role]
	if !roleExists {
		return false
	}

	permissions, resourceExists := resources[resource]
	if !resourceExists {
		return false
	}

	return permissions[permission]
}
