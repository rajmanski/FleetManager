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
    steps,
    activeStep,
    activeStepIndex,
    goToStep,
    nextStep,
    prevStep,
    vehicleOptions,
    driverOptions,
    waypointDropoffOptions,
    cargoWatch,
    setCargoItems,
    cargoItemErrors,
    mutation,
    submissionState,
    backendSectionErrors,
    routeFlowError,
    criticalIssues,
    canSubmit,
    totalWeightKg,
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
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            {steps.map((step, index) => {
              const isActive = step.id === activeStep.id
              const hasBackendIssues = backendSectionErrors[step.id].length > 0
              return (
                <Button
                  key={step.id}
                  type="button"
                  variant={isActive ? 'primary' : 'secondary'}
                  className="px-3 py-1.5"
                  onClick={() => goToStep(index)}
                >
                  {index + 1}. {step.title}
                  {hasBackendIssues ? ' *' : ''}
                </Button>
              )
            })}
          </div>

          {backendSectionErrors[activeStep.id].length > 0 && (
            <ErrorMessage
              message={backendSectionErrors[activeStep.id].join(' ')}
            />
          )}

          {activeStep.id === 'client_order' && (
            <OrderPlanningClientOrderSection
              control={control}
              register={register}
              errors={errors}
              selectedClient={selectedClient}
              onClientChange={setSelectedClient}
            />
          )}

          {activeStep.id === 'cargo' && (
            <OrderPlanningCargoSection
              items={cargoWatch}
              onItemsChange={setCargoItems}
              waypointDropoffOptions={waypointDropoffOptions}
              itemErrors={cargoItemErrors}
            />
          )}

          {activeStep.id === 'route' && (
            <OrderPlanningRouteSection {...routePlanning} />
          )}

          {activeStep.id === 'resources' && (
            <OrderPlanningResourcesSection
              register={register}
              errors={errors}
              vehicleOptions={vehicleOptions}
              driverOptions={driverOptions}
            />
          )}

          {activeStep.id === 'summary' && (
            <OrderPlanningSummarySection
              selectedClient={selectedClient}
              orderNumber={orderNumber}
              cargoLineCount={cargoWatch.length}
              totalWeightKg={totalWeightKg}
              routeResult={routePlanning.result}
            />
          )}
        </section>

        {criticalIssues.length > 0 && activeStep.id !== 'route' && (
          <ErrorMessage message={criticalIssues.join(' ')} />
        )}

        {(routeFlowError || mutation.error) && (
          <ErrorMessage
            message={
              routeFlowError ??
              extractApiError(mutation.error) ??
              'Failed to create planned order.'
            }
          />
        )}

        {submissionState === 'partial_validation' && (
          <p className="text-sm text-amber-700">
            Partial validation failed. Fix highlighted fields and continue.
          </p>
        )}
        {submissionState === 'retry' && (
          <p className="text-sm text-amber-700">
            Submission failed. You can update data and retry.
          </p>
        )}
        {submissionState === 'loading' && (
          <p className="text-sm text-gray-600">Saving workflow...</p>
        )}

        <div className="flex justify-between gap-3">
          <div>
            {activeStepIndex > 0 && (
              <Button type="button" variant="secondary" onClick={prevStep}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            {activeStep.id !== 'summary' && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void nextStep()
                }}
              >
                Next step
              </Button>
            )}
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit}
            className="min-w-[10rem]"
          >
            {mutation.isPending ? 'Saving…' : 'Create planned order'}
          </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
