package repository

import (
	"context"
	"database/sql"
	"strings"

	"fleet-management/internal/changelog"
	sqlc "fleet-management/internal/db/sqlc"
)

type ChangelogRepository struct {
	queries sqlc.Querier
}

func NewChangelogRepository(queries sqlc.Querier) *ChangelogRepository {
	return &ChangelogRepository{queries: queries}
}

func buildChangelogCountParams(query changelog.ListChangelogQuery) (sqlc.CountChangelogParams, error) {
	userFlag := interface{}(0)
	userID := sql.NullInt32{Int32: 0, Valid: true}
	if query.UserID > 0 {
		userFlag = 1
		userID = sql.NullInt32{Int32: int32(query.UserID), Valid: true}
	}

	recordFlag := interface{}(0)
	recordID := int32(0)
	if query.RecordID > 0 {
		recordFlag = 1
		recordID = int32(query.RecordID)
	}

	tableName := strings.TrimSpace(query.TableName)
	tableFlag := interface{}("")
	if tableName != "" {
		tableFlag = tableName
	}

	op := strings.TrimSpace(strings.ToUpper(query.Operation))
	opFlag := interface{}("")
	opEnum := sqlc.ChangelogOperationINSERT
	if op != "" {
		if !isValidChangelogOperation(op) {
			return sqlc.CountChangelogParams{}, changelog.ErrInvalidInput
		}
		opEnum = sqlc.ChangelogOperation(op)
		opFlag = op
	}

	dateFromFlag := interface{}(0)
	dateFrom := sql.NullTime{}
	if query.DateFrom != nil {
		dateFromFlag = 1
		dateFrom = sql.NullTime{Time: *query.DateFrom, Valid: true}
	}

	dateToFlag := interface{}(0)
	dateTo := sql.NullTime{}
	if query.DateTo != nil {
		dateToFlag = 1
		dateTo = sql.NullTime{Time: *query.DateTo, Valid: true}
	}

	return sqlc.CountChangelogParams{
		Column1:     userFlag,
		UserID:      userID,
		Column3:     recordFlag,
		RecordID:    recordID,
		Column5:     tableFlag,
		TableName:   tableName,
		Column7:     opFlag,
		Operation:   opEnum,
		Column9:     dateFromFlag,
		Timestamp:   dateFrom,
		Column11:    dateToFlag,
		Timestamp_2: dateTo,
	}, nil
}

func countParamsToListParams(c sqlc.CountChangelogParams, limit, offset int32) sqlc.ListChangelogParams {
	return sqlc.ListChangelogParams{
		Column1:     c.Column1,
		UserID:      c.UserID,
		Column3:     c.Column3,
		RecordID:    c.RecordID,
		Column5:     c.Column5,
		TableName:   c.TableName,
		Column7:     c.Column7,
		Operation:   c.Operation,
		Column9:     c.Column9,
		Timestamp:   c.Timestamp,
		Column11:    c.Column11,
		Timestamp_2: c.Timestamp_2,
		Limit:       limit,
		Offset:      offset,
	}
}

func (r *ChangelogRepository) List(ctx context.Context, query changelog.ListChangelogQuery) ([]changelog.Entry, int64, error) {
	offset := (query.Page - 1) * query.Limit

	shared, err := buildChangelogCountParams(query)
	if err != nil {
		return nil, 0, err
	}

	listArg := countParamsToListParams(shared, query.Limit, offset)

	rows, err := r.queries.ListChangelog(ctx, listArg)
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.CountChangelog(ctx, shared)
	if err != nil {
		return nil, 0, err
	}

	out := make([]changelog.Entry, 0, len(rows))
	for _, row := range rows {
		out = append(out, mapChangelogRow(row))
	}
	return out, total, nil
}

func mapChangelogRow(row sqlc.ListChangelogRow) changelog.Entry {
	e := changelog.Entry{
		ID:        row.ID,
		TableName: row.TableName,
		RecordID:  row.RecordID,
		Operation: string(row.Operation),
	}
	if row.UserID.Valid {
		v := row.UserID.Int32
		e.UserID = &v
	}
	if row.Username.Valid {
		v := row.Username.String
		e.Username = &v
	}
	if len(row.OldData) > 0 {
		e.OldData = row.OldData
	}
	if len(row.NewData) > 0 {
		e.NewData = row.NewData
	}
	if row.Timestamp.Valid {
		t := row.Timestamp.Time
		e.Timestamp = &t
	}
	return e
}

func isValidChangelogOperation(op string) bool {
	switch sqlc.ChangelogOperation(op) {
	case sqlc.ChangelogOperationINSERT, sqlc.ChangelogOperationUPDATE, sqlc.ChangelogOperationDELETE:
		return true
	default:
		return false
	}
}
