package repository

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/clients"
)

type ClientsRepository struct {
	queries sqlc.Querier
}

func NewClientsRepository(queries sqlc.Querier) *ClientsRepository {
	return &ClientsRepository{queries: queries}
}

func (r *ClientsRepository) ListClients(ctx context.Context, query clients.ListClientsQuery) ([]clients.Client, int64, error) {
	offset := (query.Page - 1) * query.Limit
	searchFilter := query.Search
	searchColumnValue := interface{}(searchFilter)
	if searchFilter == "" {
		searchColumnValue = ""
	}
	includeDeletedFilter := interface{}(0)
	if query.IncludeDeleted {
		includeDeletedFilter = 1
	}

	rows, err := r.queries.ListClients(ctx, sqlc.ListClientsParams{
		Column1: includeDeletedFilter,
		Column2: searchColumnValue,
		LOWER:   searchFilter,
		CONCAT:  searchFilter,
		Limit:   query.Limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.CountClients(ctx, sqlc.CountClientsParams{
		Column1: includeDeletedFilter,
		Column2: searchColumnValue,
		LOWER:   searchFilter,
		CONCAT:  searchFilter,
	})
	if err != nil {
		return nil, 0, err
	}

	result := make([]clients.Client, 0, len(rows))
	for _, row := range rows {
		result = append(result, mapClientRow(row))
	}
	return result, total, nil
}

func (r *ClientsRepository) GetClientByID(ctx context.Context, clientID int64) (clients.Client, error) {
	row, err := r.queries.GetClientByID(ctx, int32(clientID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return clients.Client{}, clients.ErrClientNotFound
		}
		return clients.Client{}, err
	}
	return mapClientRow(row), nil
}

func (r *ClientsRepository) CreateClient(ctx context.Context, input clients.CreateClientRequest) (int64, error) {
	id, err := r.queries.CreateClient(ctx, sqlc.CreateClientParams{
		CompanyName:  strings.TrimSpace(input.CompanyName),
		Nip:          strings.TrimSpace(input.NIP),
		Address:      toNullString(input.Address),
		ContactEmail: toNullString(input.ContactEmail),
	})
	if err != nil {
		if isDuplicateEntryError(err) {
			return 0, clients.ErrClientNIPConflict
		}
		return 0, err
	}
	return id, nil
}

func (r *ClientsRepository) UpdateClient(ctx context.Context, clientID int64, input clients.UpdateClientRequest) error {
	rows, err := r.queries.UpdateClient(ctx, sqlc.UpdateClientParams{
		CompanyName:  strings.TrimSpace(input.CompanyName),
		Nip:          strings.TrimSpace(input.NIP),
		Address:      toNullString(input.Address),
		ContactEmail: toNullString(input.ContactEmail),
		ClientID:     int32(clientID),
	})
	if err != nil {
		if isDuplicateEntryError(err) {
			return clients.ErrClientNIPConflict
		}
		return err
	}
	if rows == 0 {
		return clients.ErrClientNotFound
	}
	return nil
}

func (r *ClientsRepository) DeleteClient(ctx context.Context, clientID int64) error {
	rows, err := r.queries.SoftDeleteClient(ctx, int32(clientID))
	if err != nil {
		return err
	}
	if rows == 0 {
		return clients.ErrClientNotFound
	}
	return nil
}

func (r *ClientsRepository) RestoreClient(ctx context.Context, clientID int64) error {
	nip, err := r.queries.GetDeletedClientNIPByID(ctx, int32(clientID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return clients.ErrClientNotFound
		}
		return err
	}

	nipConflict, err := r.queries.HasActiveClientWithNIPExcludingID(ctx, sqlc.HasActiveClientWithNIPExcludingIDParams{
		Nip:      nip,
		ClientID: int32(clientID),
	})
	if err != nil {
		return err
	}
	if nipConflict {
		return clients.ErrClientRestoreConflict
	}

	rows, err := r.queries.RestoreClientByID(ctx, int32(clientID))
	if err != nil {
		return err
	}
	if rows == 0 {
		return clients.ErrClientNotFound
	}

	return nil
}

func mapClientRow(row sqlc.Client) clients.Client {
	client := clients.Client{
		ID:          int64(row.ClientID),
		CompanyName: row.CompanyName,
		NIP:         row.Nip,
	}
	if row.Address.Valid {
		value := row.Address.String
		client.Address = &value
	}
	if row.ContactEmail.Valid {
		value := row.ContactEmail.String
		client.ContactEmail = &value
	}
	if row.CreatedAt.Valid {
		value := row.CreatedAt.Time
		client.CreatedAt = &value
	}
	if row.DeletedAt.Valid {
		value := row.DeletedAt.Time
		client.DeletedAt = &value
	}
	return client
}

var _ clients.Repository = (*ClientsRepository)(nil)
