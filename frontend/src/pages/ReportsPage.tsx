import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { ReportsQueryForm } from '@/components/reports/ReportsQueryForm'
import { ReportResultsPanel } from '@/components/reports/ReportResultsPanel'
import { useVehicles } from '@/hooks/vehicles/useVehicles'
import { useDrivers } from '@/hooks/drivers/useDrivers'
import {
  parseReportsSearchParams,
  buildReportsSearchParams,
  type ReportsFormValues,
} from '@/schemas/reports'

function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const formValues = useMemo(
    () => parseReportsSearchParams(searchParams),
    [searchParams],
  )

  const { vehiclesQuery } = useVehicles({
    page: 1, limit: 100, statusFilter: '', search: '', showDeleted: false,
  })

  const { driversQuery } = useDrivers({
    page: 1, limit: 100, statusFilter: '', search: '', showDeleted: false,
  })

  const vehicleOptions = useMemo(() => {
    const vehicles = vehiclesQuery.data?.data ?? []
    return vehicles.map((v) => ({
      value: String(v.id),
      label: `${v.vin}${v.plate_number ? ` (${v.plate_number})` : ''}`,
    }))
  }, [vehiclesQuery.data])

  const driverOptions = useMemo(() => {
    const drivers = driversQuery.data?.data ?? []
    return drivers.map((d) => ({
      value: String(d.id),
      label: `${d.first_name} ${d.last_name}`,
    }))
  }, [driversQuery.data])

  const handleApply = (values: ReportsFormValues) => {
    setSearchParams(buildReportsSearchParams(values))
  }

  const listsError =
    vehiclesQuery.isError || driversQuery.isError
      ? 'Could not load vehicles or drivers for the form.'
      : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Choose a report type and set parameters for the query."
      />

      {listsError && <ErrorMessage message={listsError} />}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full shrink-0 lg:w-auto">
          <ReportsQueryForm
            formValues={formValues}
            vehicleOptions={vehicleOptions}
            driverOptions={driverOptions}
            vehiclesLoading={vehiclesQuery.isLoading}
            driversLoading={driversQuery.isLoading}
            onApply={handleApply}
          />
        </div>
        <div className="min-w-0 flex-1">
          <ReportResultsPanel searchParams={searchParams} />
        </div>
      </div>
    </div>
  )
}

export default ReportsPage
