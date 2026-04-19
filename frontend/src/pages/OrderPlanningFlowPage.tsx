import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { OrderPlanningCargoSection } from '@/components/orders-planning/OrderPlanningCargoSection'
import { OrderPlanningClientOrderSection } from '@/components/orders-planning/OrderPlanningClientOrderSection'
import { OrderPlanningResourcesSection } from '@/components/orders-planning/OrderPlanningResourcesSection'
import { OrderPlanningRouteSection } from '@/components/orders-planning/OrderPlanningRouteSection'
import { OrderPlanningSummarySection } from '@/components/orders-planning/OrderPlanningSummarySection'
import { useOrderPlanningFlow } from '@/hooks/orders/useOrderPlanningFlow'
import { extractApiError } from '@/utils/api'

export default function OrderPlanningFlowPage() {
  const flow = useOrderPlanningFlow()

  const {
    register,
    handleSubmit,
    control,
    watch,
    errors,
    selectedClient,
    setSelectedClient,
    routePlanning,
    vehicleOptions,
    driverOptions,
    waypointDropoffOptions,
    cargoWatch,
    setCargoItems,
    cargoItemErrors,
    mutation,
    routeFlowError,
    totalWeightKg,
    isCalculating,
  } = flow

  const orderNumber = watch('orderNumber') ?? ''

  return (
    <div className="space-y-8">
      <PageHeader
        title="New order with route planning"
        description="Create an order, plan the route with waypoints, assign cargo and resources, then submit in one workflow."
      />

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
        noValidate
      >
        <OrderPlanningClientOrderSection
          control={control}
          register={register}
          errors={errors}
          selectedClient={selectedClient}
          onClientChange={setSelectedClient}
        />

        <OrderPlanningCargoSection
          items={cargoWatch}
          onItemsChange={setCargoItems}
          waypointDropoffOptions={waypointDropoffOptions}
          itemErrors={cargoItemErrors}
        />

        <OrderPlanningRouteSection {...routePlanning} />

        <OrderPlanningResourcesSection
          register={register}
          errors={errors}
          vehicleOptions={vehicleOptions}
          driverOptions={driverOptions}
        />

        <OrderPlanningSummarySection
          selectedClient={selectedClient}
          orderNumber={orderNumber}
          cargoLineCount={cargoWatch.length}
          totalWeightKg={totalWeightKg}
          routeResult={routePlanning.result}
        />

        {(routeFlowError || mutation.error) && (
          <ErrorMessage
            message={
              routeFlowError ??
              extractApiError(mutation.error) ??
              'Failed to create planned order.'
            }
          />
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            disabled={mutation.isPending || isCalculating}
            className="min-w-[10rem]"
          >
            {mutation.isPending ? 'Saving…' : 'Create planned order'}
          </Button>
        </div>
      </form>
    </div>
  )
}
