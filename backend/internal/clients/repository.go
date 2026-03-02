package clients

import "context"

type Repository interface {
	ListClients(ctx context.Context, query ListClientsQuery) ([]Client, int64, error)
	GetClientByID(ctx context.Context, clientID int64) (Client, error)
	CreateClient(ctx context.Context, input CreateClientRequest) (int64, error)
	UpdateClient(ctx context.Context, clientID int64, input UpdateClientRequest) error
	DeleteClient(ctx context.Context, clientID int64) error
}

