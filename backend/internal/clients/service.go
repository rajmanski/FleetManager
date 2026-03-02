package clients

import (
	"context"
	"strings"
)

const (
	defaultListPage  int32 = 1
	defaultListLimit int32 = 50
	maxListLimit     int32 = 100
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListClients(ctx context.Context, query ListClientsQuery) (ListClientsResponse, error) {
	page := query.Page
	limit := query.Limit
	if page <= 0 {
		page = defaultListPage
	}
	if limit <= 0 {
		limit = defaultListLimit
	}
	if limit > maxListLimit {
		return ListClientsResponse{}, ErrInvalidInput
	}

	search := strings.TrimSpace(query.Search)

	rows, total, err := s.repo.ListClients(ctx, ListClientsQuery{
		Search:         search,
		IncludeDeleted: query.IncludeDeleted,
		Page:           page,
		Limit:          limit,
	})
	if err != nil {
		return ListClientsResponse{}, err
	}

	return ListClientsResponse{
		Data:  rows,
		Page:  page,
		Limit: limit,
		Total: total,
	}, nil
}

func (s *Service) GetClientByID(ctx context.Context, clientID int64) (Client, error) {
	if clientID <= 0 {
		return Client{}, ErrInvalidInput
	}
	return s.repo.GetClientByID(ctx, clientID)
}

func (s *Service) CreateClient(ctx context.Context, req CreateClientRequest) (Client, error) {
	req.CompanyName = strings.TrimSpace(req.CompanyName)
	req.NIP = strings.TrimSpace(req.NIP)

	if err := validateBasicClientFields(req.CompanyName, req.NIP, req.ContactEmail); err != nil {
		return Client{}, err
	}

	id, err := s.repo.CreateClient(ctx, req)
	if err != nil {
		return Client{}, err
	}
	return s.repo.GetClientByID(ctx, id)
}

func (s *Service) UpdateClient(ctx context.Context, clientID int64, req UpdateClientRequest) (Client, error) {
	if clientID <= 0 {
		return Client{}, ErrInvalidInput
	}

	req.CompanyName = strings.TrimSpace(req.CompanyName)
	req.NIP = strings.TrimSpace(req.NIP)

	if err := validateBasicClientFields(req.CompanyName, req.NIP, req.ContactEmail); err != nil {
		return Client{}, err
	}

	if err := s.repo.UpdateClient(ctx, clientID, req); err != nil {
		return Client{}, err
	}

	return s.repo.GetClientByID(ctx, clientID)
}

func (s *Service) DeleteClient(ctx context.Context, clientID int64) error {
	if clientID <= 0 {
		return ErrInvalidInput
	}
	return s.repo.DeleteClient(ctx, clientID)
}

func validateBasicClientFields(companyName, nip string, contactEmail *string) error {
	if len(companyName) < 3 {
		return ErrInvalidInput
	}

	if ok, err := ValidateNIP(nip); err != nil || !ok {
		if err != nil {
			return err
		}
		return ErrInvalidInput
	}

	if contactEmail != nil {
		email := strings.TrimSpace(*contactEmail)
		if email == "" {
			return ErrInvalidInput
		}
		if !strings.Contains(email, "@") {
			return ErrInvalidInput
		}
	}

	return nil
}

