package auth

import "testing"

func TestHasPermissionFromMatrix(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		role       string
		resource   Resource
		permission Permission
		allowed    bool
	}{
		{
			name:       "administrator write users allowed",
			role:       "Administrator",
			resource:   ResourceUsers,
			permission: PermissionWrite,
			allowed:    true,
		},
		{
			name:       "spedytor write users denied",
			role:       "Spedytor",
			resource:   ResourceUsers,
			permission: PermissionWrite,
			allowed:    false,
		},
		{
			name:       "mechanik read orders denied",
			role:       "Mechanik",
			resource:   ResourceOrders,
			permission: PermissionRead,
			allowed:    false,
		},
		{
			name:       "mechanik write vehicles allowed",
			role:       "Mechanik",
			resource:   ResourceVehicles,
			permission: PermissionWrite,
			allowed:    true,
		},
		{
			name:       "administrator write audit log denied",
			role:       "Administrator",
			resource:   ResourceAuditLog,
			permission: PermissionWrite,
			allowed:    false,
		},
		{
			name:       "administrator read dictionaries allowed",
			role:       "Administrator",
			resource:   ResourceDictionaries,
			permission: PermissionRead,
			allowed:    true,
		},
		{
			name:       "spedytor read dictionaries denied",
			role:       "Spedytor",
			resource:   ResourceDictionaries,
			permission: PermissionRead,
			allowed:    false,
		},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			allowed := hasPermission(tc.role, tc.resource, tc.permission)
			if allowed != tc.allowed {
				t.Fatalf("hasPermission(%q, %q, %q) = %v, want %v",
					tc.role, tc.resource, tc.permission, allowed, tc.allowed)
			}
		})
	}
}
