package repository

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/drivers"
)

type DriversRepository struct {
	queries sqlc.Querier
}

func NewDriversRepository(queries sqlc.Querier) *DriversRepository {
	return &DriversRepository{queries: queries}
}

func (r *DriversRepository) ListDrivers(ctx context.Context, query drivers.ListDriversQuery) ([]drivers.Driver, int64, error) {
	offset := (query.Page - 1) * query.Limit
	statusFilter := toNullDriversStatus(query.Status)
	statusColumnValue := interface{}(query.Status)
	if query.Status == "" {
		statusColumnValue = ""
	}
	searchFilter := query.Search
	searchColumnValue := interface{}(searchFilter)
	if searchFilter == "" {
		searchColumnValue = ""
	}
	includeDeletedFilter := interface{}(0)
	if query.IncludeDeleted {
		includeDeletedFilter = 1
	}

	rows, err := r.queries.ListDrivers(ctx, sqlc.ListDriversParams{
		Column1: includeDeletedFilter,
		Column2: searchColumnValue,
		LOWER:   searchFilter,
		LOWER_2: searchFilter,
		Column5: statusColumnValue,
		Status:  statusFilter,
		Limit:   query.Limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.CountDrivers(ctx, sqlc.CountDriversParams{
		Column1: includeDeletedFilter,
		Column2: searchColumnValue,
		LOWER:   searchFilter,
		LOWER_2: searchFilter,
		Column5: statusColumnValue,
		Status:  statusFilter,
	})
	if err != nil {
		return nil, 0, err
	}

	result := make([]drivers.Driver, 0, len(rows))
	for _, row := range rows {
		result = append(result, mapDriverRow(row))
	}
	return result, total, nil
}

func (r *DriversRepository) GetDriverByID(ctx context.Context, driverID int64) (drivers.Driver, error) {
	row, err := r.queries.GetDriverByID(ctx, int32(driverID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return drivers.Driver{}, drivers.ErrDriverNotFound
		}
		return drivers.Driver{}, err
	}
	return mapGetDriverRow(row), nil
}

func (r *DriversRepository) CreateDriver(ctx context.Context, input drivers.CreateDriverRequest) (int64, error) {
	pesel := strings.TrimSpace(input.PESEL)
	status := normalizeDriverStatus(input.Status)
	if status == "" {
		status = "Available"
	}

	id, err := r.queries.CreateDriver(ctx, sqlc.CreateDriverParams{
		UserID:    toNullInt32(input.UserID),
		FirstName: strings.TrimSpace(input.FirstName),
		LastName:  strings.TrimSpace(input.LastName),
		Pesel:     pesel,
		Phone:     toNullString(input.Phone),
		Email:     toNullString(input.Email),
		Status:    toNullDriversStatus(status),
	})
	if err != nil {
		if isDuplicateEntryError(err) {
			return 0, drivers.ErrDriverPESELConflict
		}
		return 0, err
	}
	return id, nil
}

func (r *DriversRepository) UpdateDriver(ctx context.Context, driverID int64, input drivers.UpdateDriverRequest) error {
	pesel := strings.TrimSpace(input.PESEL)
	status := normalizeDriverStatus(input.Status)

	rows, err := r.queries.UpdateDriver(ctx, sqlc.UpdateDriverParams{
		UserID:    toNullInt32(input.UserID),
		FirstName: strings.TrimSpace(input.FirstName),
		LastName:  strings.TrimSpace(input.LastName),
		Pesel:     pesel,
		Phone:     toNullString(input.Phone),
		Email:     toNullString(input.Email),
		Status:    toNullDriversStatus(status),
		DriverID:  int32(driverID),
	})
	if err != nil {
		if isDuplicateEntryError(err) {
			return drivers.ErrDriverPESELConflict
		}
		return err
	}
	if rows == 0 {
		return drivers.ErrDriverNotFound
	}
	return nil
}

func (r *DriversRepository) DeleteDriver(ctx context.Context, driverID int64) error {
	rows, err := r.queries.SoftDeleteDriver(ctx, int32(driverID))
	if err != nil {
		return err
	}
	if rows == 0 {
		return drivers.ErrDriverNotFound
	}
	return nil
}

func (r *DriversRepository) RestoreDriver(ctx context.Context, driverID int64) error {
	pesel, err := r.queries.GetDeletedDriverPESELByID(ctx, int32(driverID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return drivers.ErrDriverNotFound
		}
		return err
	}

	conflict, err := r.queries.HasActiveDriverWithPESELExcludingID(ctx, sqlc.HasActiveDriverWithPESELExcludingIDParams{
		Pesel:    pesel,
		DriverID: int32(driverID),
	})
	if err != nil {
		return err
	}
	if conflict {
		return drivers.ErrDriverRestoreConflict
	}

	rows, err := r.queries.RestoreDriverByID(ctx, int32(driverID))
	if err != nil {
		return err
	}
	if rows == 0 {
		return drivers.ErrDriverNotFound
	}

	return nil
}

func toNullDriversStatus(status string) sqlc.NullDriversStatus {
	if strings.TrimSpace(status) == "" {
		return sqlc.NullDriversStatus{}
	}
	return sqlc.NullDriversStatus{
		DriversStatus: sqlc.DriversStatus(status),
		Valid:         true,
	}
}

func normalizeDriverStatus(status string) string {
	return strings.TrimSpace(status)
}

func mapDriverRow(row sqlc.Driver) drivers.Driver {
	d := drivers.Driver{
		ID:        int64(row.DriverID),
		FirstName: row.FirstName,
		LastName:  row.LastName,
		PESEL:     row.Pesel,
		Status:    string(row.Status.DriversStatus),
	}
	if row.UserID.Valid {
		v := row.UserID.Int32
		d.UserID = &v
	}
	if row.Phone.Valid {
		v := row.Phone.String
		d.Phone = &v
	}
	if row.Email.Valid {
		v := row.Email.String
		d.Email = &v
	}
	if row.CreatedAt.Valid {
		v := row.CreatedAt.Time
		d.CreatedAt = &v
	}
	if row.UpdatedAt.Valid {
		v := row.UpdatedAt.Time
		d.UpdatedAt = &v
	}
	if row.DeletedAt.Valid {
		v := row.DeletedAt.Time
		d.DeletedAt = &v
	}
	return d
}

func mapGetDriverRow(row sqlc.GetDriverByIDRow) drivers.Driver {
	d := drivers.Driver{
		ID:        int64(row.DriverID),
		FirstName: row.FirstName,
		LastName:  row.LastName,
		PESEL:     row.Pesel,
		Status:    string(row.Status.DriversStatus),
	}
	if row.UserID.Valid {
		v := row.UserID.Int32
		d.UserID = &v
	}
	if row.Phone.Valid {
		v := row.Phone.String
		d.Phone = &v
	}
	if row.Email.Valid {
		v := row.Email.String
		d.Email = &v
	}
	if row.CreatedAt.Valid {
		v := row.CreatedAt.Time
		d.CreatedAt = &v
	}
	if row.UpdatedAt.Valid {
		v := row.UpdatedAt.Time
		d.UpdatedAt = &v
	}
	return d
}
