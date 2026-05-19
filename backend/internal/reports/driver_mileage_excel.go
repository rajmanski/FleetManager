package reports

import (
	"fmt"

	"github.com/xuri/excelize/v2"
)

func buildDriverMileageExcel(r DriverMileageResponse) ([]byte, error) {
	f := excelize.NewFile()
	defer func() { _ = f.Close() }()

	const sheet = "Driver Mileage"
	if err := f.SetSheetName("Sheet1", sheet); err != nil {
		return nil, err
	}

	_ = f.SetCellValue(sheet, "A1", "Driver mileage")
	_ = f.SetCellValue(sheet, "A2", "Driver ID")
	_ = f.SetCellValue(sheet, "B2", r.DriverID)
	_ = f.SetCellValue(sheet, "A3", "Period")
	_ = f.SetCellValue(sheet, "B3", r.Period)
	_ = f.SetCellValue(sheet, "A4", "Total distance (km)")
	_ = f.SetCellValue(sheet, "B4", r.TotalKm)
	_ = f.SetCellValue(sheet, "A5", "Orders (distinct)")
	_ = f.SetCellValue(sheet, "B5", r.OrdersCount)

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, fmt.Errorf("write xlsx buffer: %w", err)
	}
	return buf.Bytes(), nil
}
