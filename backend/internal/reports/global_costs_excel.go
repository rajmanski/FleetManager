package reports

import (
	"fmt"

	"github.com/xuri/excelize/v2"
)

func buildGlobalCostsExcel(r GlobalCostsResponse) ([]byte, error) {
	f := excelize.NewFile()
	defer func() { _ = f.Close() }()

	const sheet = "Global Costs"
	if err := f.SetSheetName("Sheet1", sheet); err != nil {
		return nil, err
	}

	_ = f.SetCellValue(sheet, "A1", "Global cost report")
	_ = f.SetCellValue(sheet, "A2", "Period")
	_ = f.SetCellValue(sheet, "B2", r.Period)
	_ = f.SetCellValue(sheet, "A3", "Fuel (PLN)")
	if err := f.SetCellFloat(sheet, "B3", r.CostsByCategory.Fuel, 2, 64); err != nil {
		return nil, err
	}
	_ = f.SetCellValue(sheet, "A4", "Maintenance (PLN)")
	if err := f.SetCellFloat(sheet, "B4", r.CostsByCategory.Maintenance, 2, 64); err != nil {
		return nil, err
	}
	_ = f.SetCellValue(sheet, "A5", "Insurance (PLN)")
	if err := f.SetCellFloat(sheet, "B5", r.CostsByCategory.Insurance, 2, 64); err != nil {
		return nil, err
	}
	_ = f.SetCellValue(sheet, "A6", "Tolls (PLN)")
	if err := f.SetCellFloat(sheet, "B6", r.CostsByCategory.Tolls, 2, 64); err != nil {
		return nil, err
	}
	_ = f.SetCellValue(sheet, "A7", "Other (PLN)")
	if err := f.SetCellFloat(sheet, "B7", r.CostsByCategory.Other, 2, 64); err != nil {
		return nil, err
	}
	_ = f.SetCellValue(sheet, "A8", "Total (PLN)")
	if err := f.SetCellFloat(sheet, "B8", r.Total, 2, 64); err != nil {
		return nil, err
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, fmt.Errorf("write xlsx buffer: %w", err)
	}
	return buf.Bytes(), nil
}
