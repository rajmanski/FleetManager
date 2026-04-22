import { act, renderHook } from '@testing-library/react'
import { useOrderPlanningStepNavigation } from './useOrderPlanningStepNavigation'

describe('useOrderPlanningStepNavigation', () => {
  it('does not move to next step when route critical issues exist', async () => {
    const trigger = vi.fn(async () => true)
    const setSubmissionState = vi.fn()
    const { result } = renderHook(() =>
      useOrderPlanningStepNavigation({
        steps: [{ id: 'route' }, { id: 'resources' }],
        criticalIssuesCount: 1,
        trigger,
        setSubmissionState,
      }),
    )

    await act(async () => {
      await result.current.nextStep()
    })

    expect(result.current.activeStep.id).toBe('route')
    expect(setSubmissionState).toHaveBeenCalledWith('partial_validation')
    expect(trigger).not.toHaveBeenCalled()
  })

  it('validates fields and moves forward when current step is valid', async () => {
    const trigger = vi.fn(async () => true)
    const setSubmissionState = vi.fn()
    const { result } = renderHook(() =>
      useOrderPlanningStepNavigation({
        steps: [{ id: 'client_order' }, { id: 'cargo' }],
        criticalIssuesCount: 0,
        trigger,
        setSubmissionState,
      }),
    )

    await act(async () => {
      await result.current.nextStep()
    })

    expect(trigger).toHaveBeenCalled()
    expect(result.current.activeStep.id).toBe('cargo')
  })

  it('ignores out-of-range goToStep indices', () => {
    const trigger = vi.fn(async () => true)
    const setSubmissionState = vi.fn()
    const { result } = renderHook(() =>
      useOrderPlanningStepNavigation({
        steps: [{ id: 'client_order' }, { id: 'cargo' }],
        criticalIssuesCount: 0,
        trigger,
        setSubmissionState,
      }),
    )

    act(() => {
      result.current.goToStep(-1)
      result.current.goToStep(999)
    })

    expect(result.current.activeStep.id).toBe('client_order')
  })

  it('returns true on summary step and does not move further', async () => {
    const trigger = vi.fn(async () => true)
    const setSubmissionState = vi.fn()
    const { result } = renderHook(() =>
      useOrderPlanningStepNavigation({
        steps: [{ id: 'summary' }],
        criticalIssuesCount: 0,
        trigger,
        setSubmissionState,
      }),
    )

    let nextResult = false
    await act(async () => {
      nextResult = await result.current.nextStep()
    })

    expect(nextResult).toBe(true)
    expect(result.current.activeStep.id).toBe('summary')
    expect(trigger).not.toHaveBeenCalled()
  })
})
