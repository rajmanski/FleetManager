package reports

import (
	"fmt"

	"github.com/xuri/excelize/v2"
)

func buildVehicleProfitabilityExcel(r VehicleProfitabilityResponse) ([]byte, error) {
	f := excelize.NewFile()
	defer func() { _ = f.Close() }()

	const sheet = "Profitability"
	if err := f.SetSheetName("Sheet1", sheet); err != nil {
		return nil, err
	}

	_ = f.SetCellValue(sheet, "A1", "Vehicle profitability")
	_ = f.SetCellValue(sheet, "A2", "Vehicle ID")
	_ = f.SetCellValue(sheet, "B2", r.VehicleID)
	_ = f.SetCellValue(sheet, "A3", "Month")
	_ = f.SetCellValue(sheet, "B3", r.Month)
	_ = f.SetCellValue(sheet, "A4", "Revenue (PLN)")
	if err := f.SetCellFloat(sheet, "B4", r.Revenue, 2, 64); err != nil {
		return nil, err
	}
	_ = f.SetCellValue(sheet, "A5", "Cost — fuel (PLN)")
	if err := f.SetCellFloat(sheet, "B5", r.Costs.Fuel, 2, 64); err != nil {
		return nil, err
	}
	_ = f.SetCellValue(sheet, "A6", "Cost — maintenance (PLN)")
	if err := f.SetCellFloat(sheet, "B6", r.Costs.Maintenance, 2, 64); err != nil {
		return nil, err
	}
	_ = f.SetCellValue(sheet, "A7", "Cost — insurance (PLN)")
	if err := f.SetCellFloat(sheet, "B7", r.Costs.Insurance, 2, 64); err != nil {
		return nil, err
	}
	_ = f.SetCellValue(sheet, "A8", "Cost — tolls (PLN)")
	if err := f.SetCellFloat(sheet, "B8", r.Costs.Tolls, 2, 64); err != nil {
		return nil, err
	}
	_ = f.SetCellValue(sheet, "A9", "Total costs (PLN)")
	if err := f.SetCellFloat(sheet, "B9", r.Costs.Total, 2, 64); err != nil {
		return nil, err
	}
	_ = f.SetCellValue(sheet, "A10", "Profit (PLN)")
	if err := f.SetCellFloat(sheet, "B10", r.Profit, 2, 64); err != nil {
		return nil, err
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, fmt.Errorf("write xlsx buffer: %w", err)
	}
	return buf.Bytes(), nil
}
