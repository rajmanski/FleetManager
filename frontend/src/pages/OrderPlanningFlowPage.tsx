import { PageHeader } from '@/components/ui/PageHeader'
import { OrderPlanningCargoSection } from '@/components/orders-planning/OrderPlanningCargoSection'
import { OrderPlanningClientOrderSection } from '@/components/orders-planning/OrderPlanningClientOrderSection'
import { OrderPlanningFormFooter } from '@/components/orders-planning/OrderPlanningFormFooter'
import { OrderPlanningResourcesSection } from '@/components/orders-planning/OrderPlanningResourcesSection'
import { OrderPlanningRouteSection } from '@/components/orders-planning/OrderPlanningRouteSection'
import { OrderPlanningSummarySection } from '@/components/orders-planning/OrderPlanningSummarySection'
import { OrderPlanningStepBar } from '@/components/orders-planning/OrderPlanningStepBar'
import { useOrderPlanningFlow } from '@/hooks/orders/useOrderPlanningFlow'

export default function OrderPlanningFlowPage() {
  const { form, client, route, steps, cargo, resources, submission } = useOrderPlanningFlow()

  return (
    <div className="space-y-8">
      <PageHeader
        title="New order with route planning"
        description="Create an order, plan the route with waypoints, assign cargo to drop-off points from the map, assign resources, then submit in one workflow."
      />

      <form onSubmit={form.handleSubmit} className="space-y-8" noValidate>
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <OrderPlanningStepBar
            steps={steps.list}
            activeStepId={steps.active.id}
            backendSectionErrors={submission.backendSectionErrors}
            onGoToStep={steps.goTo}
          />

          {steps.active.id === 'client_order' && (
            <OrderPlanningClientOrderSection
              control={form.control}
              register={form.register}
              errors={form.errors}
              selectedClient={client.selected}
              onClientChange={client.onChange}
            />
          )}

          {steps.active.id === 'route' && <OrderPlanningRouteSection {...route} />}

          {steps.active.id === 'cargo' && (
            <OrderPlanningCargoSection
              items={cargo.items}
              onItemsChange={cargo.setItems}
              waypointDropoffOptions={cargo.waypointOptions}
              itemErrors={cargo.itemErrors}
            />
          )}

          {steps.active.id === 'resources' && (
            <OrderPlanningResourcesSection
              register={form.register}
              errors={form.errors}
              vehicleOptions={resources.vehicleOptions}
              driverOptions={resources.driverOptions}
              vehicleAvailabilityPending={resources.isPending}
            />
          )}

          {steps.active.id === 'summary' && (
            <OrderPlanningSummarySection
              selectedClient={client.selected}
              orderNumber={form.watch('orderNumber') ?? ''}
              cargoLineCount={cargo.items.length}
              totalWeightKg={cargo.totalWeightKg}
              routeResult={route.result}
            />
          )}
        </section>

        <OrderPlanningFormFooter
          submissionState={submission.state}
          flowErrors={submission.flowErrors}
          activeStepIndex={steps.activeIndex}
          activeStepId={steps.active.id}
          canSubmit={submission.canSubmit}
          isPending={submission.isPending}
          onPrev={steps.prev}
          onNext={() => { void steps.next() }}
        />
      </form>
    </div>
  )
}
