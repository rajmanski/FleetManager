package insurance

import "context"

type Repository interface {
	ListInsurancePolicies(ctx context.Context, query ListInsuranceQuery) ([]Policy, int64, error)
	GetInsurancePolicyByID(ctx context.Context, id int64) (Policy, error)
	CreateInsurancePolicy(ctx context.Context, input CreatePolicyRequest) (int64, error)
	UpdateInsurancePolicy(ctx context.Context, id int64, input UpdatePolicyRequest) error
	DeleteInsurancePolicy(ctx context.Context, id int64) error
}
