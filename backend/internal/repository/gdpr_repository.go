package repository

import (
	"context"
	"database/sql"

	sqlc "fleet-management/internal/db/sqlc"
)

type GDPRRepository struct {
	db      *sql.DB
	queries *sqlc.Queries
}

func NewGDPRRepository(db *sql.DB, queries *sqlc.Queries) *GDPRRepository {
	return &GDPRRepository{db: db, queries: queries}
}

func (r *GDPRRepository) ForgetDriver(ctx context.Context, driverID int64) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	q := r.queries.WithTx(tx)

	rows, err := q.ForgetDriverByID(ctx, int32(driverID))
	if err != nil {
		_ = tx.Rollback()
		return err
	}
	if rows == 0 {
		_ = tx.Rollback()
		return sql.ErrNoRows
	}

	if _, err := q.AnonymizeDriverChangelog(ctx, int32(driverID)); err != nil {
		_ = tx.Rollback()
		return err
	}

	return tx.Commit()
}
