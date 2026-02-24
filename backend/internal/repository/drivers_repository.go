package repository

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	sqlc "fleet-management/internal/db/sqlc"
	"fleet-management/internal/crypto"
	"fleet-management/internal/drivers"
)

type DriversRepository struct {
	queries       sqlc.Querier
	encryptionKey []byte
}

func NewDriversRepository(queries sqlc.Querier, encryptionKey []byte) *DriversRepository {
	return &DriversRepository{queries: queries, encryptionKey: encryptionKey}
}

func (r *DriversRepository) ListDrivers(ctx context.Context, query drivers.ListDriversQuery) ([]drivers.Driver, int64, error) {
	statusFilter := toNullDriversStatus(query.Status)
	statusColumnValue := interface{}(query.Status)
	if query.Status == "" {
		statusColumnValue = ""
	}
	includeDeletedFilter := interface{}(0)
	if query.IncludeDeleted {
		includeDeletedFilter = 1
	}

	if drivers.LooksLikePESEL(query.Search) {
		return r.listDriversByPESEL(ctx, query, includeDeletedFilter, statusColumnValue, statusFilter)
	}

	offset := (query.Page - 1) * query.Limit
	searchFilter := query.Search
	searchColumnValue := interface{}(searchFilter)
	if searchFilter == "" {
		searchColumnValue = ""
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
		result = append(result, r.mapListDriversRow(row))
	}
	return result, total, nil
}

func (r *DriversRepository) listDriversByPESEL(ctx context.Context, query drivers.ListDriversQuery, includeDeletedFilter, statusColumnValue interface{}, statusFilter sqlc.NullDriversStatus) ([]drivers.Driver, int64, error) {
	rows, err := r.queries.ListDriversForPESELSearch(ctx, sqlc.ListDriversForPESELSearchParams{
		Column1: includeDeletedFilter,
		Column2: statusColumnValue,
		Status:  statusFilter,
	})
	if err != nil {
		return nil, 0, err
	}

	peselSearch := strings.TrimSpace(query.Search)
	var filtered []drivers.Driver
	for _, row := range rows {
		d := r.mapListDriversForPESELSearchRow(row)
		if strings.Contains(d.PESEL, peselSearch) {
			filtered = append(filtered, d)
		}
	}

	total := int64(len(filtered))
	offset := (query.Page - 1) * query.Limit
	end := offset + query.Limit
	if offset >= int32(len(filtered)) {
		return []drivers.Driver{}, total, nil
	}
	if end > int32(len(filtered)) {
		end = int32(len(filtered))
	}
	page := filtered[offset:end]
	return page, total, nil
}

func (r *DriversRepository) GetDriverByID(ctx context.Context, driverID int64) (drivers.Driver, error) {
	row, err := r.queries.GetDriverByID(ctx, int32(driverID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return drivers.Driver{}, drivers.ErrDriverNotFound
		}
		return drivers.Driver{}, err
	}
	return r.mapGetDriverRow(row), nil
}

func (r *DriversRepository) CreateDriver(ctx context.Context, input drivers.CreateDriverRequest) (int64, error) {
	pesel := strings.TrimSpace(input.PESEL)
	encrypted, err := crypto.EncryptPESEL(pesel, r.encryptionKey)
	if err != nil {
		return 0, err
	}
	status := normalizeDriverStatus(input.Status)
	if status == "" {
		status = "Available"
	}

	id, err := r.queries.CreateDriver(ctx, sqlc.CreateDriverParams{
		UserID:    toNullInt32(input.UserID),
		FirstName: strings.TrimSpace(input.FirstName),
		LastName:  strings.TrimSpace(input.LastName),
		Pesel:     encrypted,
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

func (r *DriversRepository) UpdateDriver(ctx context.Context, driverID int64, input drivers.UpdateDriverRequest, existing drivers.Driver) error {
	pesel := strings.TrimSpace(input.PESEL)
	encrypted, err := crypto.EncryptPESEL(pesel, r.encryptionKey)
	if err != nil {
		return err
	}
	status := normalizeDriverStatus(input.Status)

	licenseNumber := toNullStringFromPtr(input.LicenseNumber, existing.LicenseNumber)
	licenseExpiryDate := toNullTimeFromTimePtr(input.LicenseExpiryDate, existing.LicenseExpiryDate)
	adrCertified := existing.ADRCertified
	if input.ADRCertified != nil {
		adrCertified = *input.ADRCertified
	}
	var adrExpiryDate sql.NullTime
	if adrCertified {
		adrExpiryDate = toNullTimeFromTimePtr(input.ADRExpiryDate, existing.ADRExpiryDate)
	}

	rows, err := r.queries.UpdateDriver(ctx, sqlc.UpdateDriverParams{
		UserID:            toNullInt32(input.UserID),
		FirstName:         strings.TrimSpace(input.FirstName),
		LastName:          strings.TrimSpace(input.LastName),
		Pesel:             encrypted,
		Phone:             toNullString(input.Phone),
		Email:             toNullString(input.Email),
		Status:            toNullDriversStatus(status),
		LicenseNumber:     licenseNumber,
		LicenseExpiryDate: licenseExpiryDate,
		AdrCertified:      adrCertified,
		AdrExpiryDate:     adrExpiryDate,
		DriverID:          int32(driverID),
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
	hasActiveTrips, err := r.queries.HasActiveTripsByDriverID(ctx, int32(driverID))
	if err != nil {
		if isTableNotFoundError(err) {
			hasActiveTrips = false
		} else {
			return err
		}
	}
	if hasActiveTrips {
		return drivers.ErrDriverHasActiveTrips
	}

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
	encryptedPesel, err := r.queries.GetDeletedDriverPESELByID(ctx, int32(driverID))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return drivers.ErrDriverNotFound
		}
		return err
	}

	plainPesel, err := crypto.DecryptPESEL(encryptedPesel, r.encryptionKey)
	if err != nil {
		return drivers.ErrDriverRestoreConflict
	}

	activeRows, err := r.queries.ListActiveDriverPESELs(ctx)
	if err != nil {
		return err
	}
	for _, row := range activeRows {
		decrypted, err := crypto.DecryptPESEL(row.Pesel, r.encryptionKey)
		if err != nil {
			continue
		}
		if decrypted == plainPesel {
			return drivers.ErrDriverRestoreConflict
		}
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

func (r *DriversRepository) GetDriverTripOrderNumberOnDate(ctx context.Context, driverID int64, date string) (string, error) {
	parsed, err := time.Parse("2006-01-02", date)
	if err != nil {
		return "", drivers.ErrInvalidInput
	}
	orderNumber, err := r.queries.GetDriverTripOnDate(ctx, sqlc.GetDriverTripOnDateParams{
		DriverID:  int32(driverID),
		CheckDate:  sql.NullTime{Time: parsed, Valid: true},
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", nil
		}
		return "", err
	}
	return orderNumber, nil
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

func toNullStringFromPtr(ptr *string, existing *string) sql.NullString {
	var s *string
	if ptr != nil {
		s = ptr
	} else {
		s = existing
	}
	return toNullString(s)
}

func toNullTimeFromTimePtr(ptr *time.Time, existing *time.Time) sql.NullTime {
	var t *time.Time
	if ptr != nil {
		t = ptr
	} else {
		t = existing
	}
	if t == nil {
		return sql.NullTime{}
	}
	return sql.NullTime{Time: *t, Valid: true}
}

func normalizeDriverStatus(status string) string {
	return strings.TrimSpace(status)
}

func (r *DriversRepository) mapListDriversRow(row sqlc.ListDriversRow) drivers.Driver {
	pesel, _ := crypto.DecryptPESEL(row.Pesel, r.encryptionKey)
	d := drivers.Driver{
		ID:           int64(row.DriverID),
		FirstName:    row.FirstName,
		LastName:     row.LastName,
		PESEL:        pesel,
		Status:       string(row.Status.DriversStatus),
		ADRCertified: row.AdrCertified,
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
	if row.LicenseNumber.Valid {
		v := row.LicenseNumber.String
		d.LicenseNumber = &v
	}
	if row.LicenseExpiryDate.Valid {
		v := row.LicenseExpiryDate.Time
		d.LicenseExpiryDate = &v
	}
	if row.AdrExpiryDate.Valid {
		v := row.AdrExpiryDate.Time
		d.ADRExpiryDate = &v
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

func (r *DriversRepository) mapListDriversForPESELSearchRow(row sqlc.ListDriversForPESELSearchRow) drivers.Driver {
	pesel, _ := crypto.DecryptPESEL(row.Pesel, r.encryptionKey)
	d := drivers.Driver{
		ID:           int64(row.DriverID),
		FirstName:    row.FirstName,
		LastName:     row.LastName,
		PESEL:        pesel,
		Status:       string(row.Status.DriversStatus),
		ADRCertified: row.AdrCertified,
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
	if row.LicenseNumber.Valid {
		v := row.LicenseNumber.String
		d.LicenseNumber = &v
	}
	if row.LicenseExpiryDate.Valid {
		v := row.LicenseExpiryDate.Time
		d.LicenseExpiryDate = &v
	}
	if row.AdrExpiryDate.Valid {
		v := row.AdrExpiryDate.Time
		d.ADRExpiryDate = &v
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

func (r *DriversRepository) mapGetDriverRow(row sqlc.GetDriverByIDRow) drivers.Driver {
	pesel, _ := crypto.DecryptPESEL(row.Pesel, r.encryptionKey)
	d := drivers.Driver{
		ID:           int64(row.DriverID),
		FirstName:    row.FirstName,
		LastName:     row.LastName,
		PESEL:        pesel,
		Status:       string(row.Status.DriversStatus),
		ADRCertified: row.AdrCertified,
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
	if row.LicenseNumber.Valid {
		v := row.LicenseNumber.String
		d.LicenseNumber = &v
	}
	if row.LicenseExpiryDate.Valid {
		v := row.LicenseExpiryDate.Time
		d.LicenseExpiryDate = &v
	}
	if row.AdrExpiryDate.Valid {
		v := row.AdrExpiryDate.Time
		d.ADRExpiryDate = &v
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
