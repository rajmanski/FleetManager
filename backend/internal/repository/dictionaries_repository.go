package repository

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/dictionaries"
)

type DictionariesRepository struct {
	queries sqlc.Querier
}

func NewDictionariesRepository(queries sqlc.Querier) *DictionariesRepository {
	return &DictionariesRepository{queries: queries}
}

func (r *DictionariesRepository) ListByCategory(ctx context.Context, category string) ([]dictionaries.Entry, error) {
	rows, err := r.queries.ListDictionariesByCategory(ctx, category)
	if err != nil {
		return nil, err
	}
	out := make([]dictionaries.Entry, 0, len(rows))
	for _, row := range rows {
		out = append(out, mapDictionaryRow(row))
	}
	return out, nil
}

func (r *DictionariesRepository) GetByID(ctx context.Context, id int64) (dictionaries.Entry, error) {
	row, err := r.queries.GetDictionaryByID(ctx, int32(id))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return dictionaries.Entry{}, dictionaries.ErrNotFound
		}
		return dictionaries.Entry{}, err
	}
	return mapDictionaryRow(row), nil
}

func (r *DictionariesRepository) Create(ctx context.Context, in dictionaries.CreateRequest) (dictionaries.Entry, error) {
	id, err := r.queries.CreateDictionary(ctx, sqlc.CreateDictionaryParams{
		Category: strings.TrimSpace(in.Category),
		Key:      strings.TrimSpace(in.Key),
		Value:    strings.TrimSpace(in.Value),
	})
	if err != nil {
		if isDuplicateEntryError(err) {
			return dictionaries.Entry{}, dictionaries.ErrDuplicate
		}
		return dictionaries.Entry{}, err
	}
	return r.GetByID(ctx, id)
}

func (r *DictionariesRepository) Update(ctx context.Context, id int64, in dictionaries.UpdateRequest) (dictionaries.Entry, error) {
	res, err := r.queries.UpdateDictionary(ctx, sqlc.UpdateDictionaryParams{
		Category: strings.TrimSpace(in.Category),
		Key:      strings.TrimSpace(in.Key),
		Value:    strings.TrimSpace(in.Value),
		ID:       int32(id),
	})
	if err != nil {
		if isDuplicateEntryError(err) {
			return dictionaries.Entry{}, dictionaries.ErrDuplicate
		}
		return dictionaries.Entry{}, err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return dictionaries.Entry{}, err
	}
	if n == 0 {
		return dictionaries.Entry{}, dictionaries.ErrNotFound
	}
	return r.GetByID(ctx, id)
}

func (r *DictionariesRepository) Delete(ctx context.Context, id int64) error {
	res, err := r.queries.DeleteDictionary(ctx, int32(id))
	if err != nil {
		return err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return dictionaries.ErrNotFound
	}
	return nil
}

func mapDictionaryRow(row sqlc.Dictionary) dictionaries.Entry {
	return dictionaries.Entry{
		ID:        int64(row.ID),
		Category:  row.Category,
		Key:       row.Key,
		Value:     row.Value,
		CreatedAt: row.CreatedAt,
	}
}
