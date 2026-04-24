import { act, renderHook } from '@testing-library/react'
import { useOrderPlanningStepNavigation } from './useOrderPlanningStepNavigation'
import type { FlowAction } from './orderPlanningFlowReducer'

function makeDispatch() {
  const dispatched: FlowAction[] = []
  const dispatch = vi.fn((action: FlowAction) => dispatched.push(action))
  return { dispatch, dispatched }
}

describe('useOrderPlanningStepNavigation', () => {
  it('dispatches STEP_VALIDATION_FAILED and does not move when route has critical issues', async () => {
    const trigger = vi.fn(async () => true)
    const { dispatch, dispatched } = makeDispatch()

    const { result } = renderHook(() =>
      useOrderPlanningStepNavigation({
        steps: [{ id: 'route' }, { id: 'resources' }],
        activeStepIndex: 0,
        criticalIssuesCount: 1,
        trigger,
        dispatch,
      }),
    )

    await act(async () => { await result.current.nextStep() })

    expect(dispatched).toContainEqual({ type: 'STEP_VALIDATION_FAILED' })
    expect(dispatched).not.toContainEqual(expect.objectContaining({ type: 'GO_TO_STEP' }))
    expect(trigger).not.toHaveBeenCalled()
  })

  it('dispatches GO_TO_STEP when current step is valid', async () => {
    const trigger = vi.fn(async () => true)
    const { dispatch, dispatched } = makeDispatch()

    const { result } = renderHook(() =>
      useOrderPlanningStepNavigation({
        steps: [{ id: 'client_order' }, { id: 'cargo' }],
        activeStepIndex: 0,
        criticalIssuesCount: 0,
        trigger,
        dispatch,
      }),
    )

    await act(async () => { await result.current.nextStep() })

    expect(trigger).toHaveBeenCalled()
    expect(dispatched).toContainEqual({ type: 'GO_TO_STEP', index: 1 })
  })

  it('dispatches STEP_VALIDATION_FAILED when form validation fails', async () => {
    const trigger = vi.fn(async () => false)
    const { dispatch, dispatched } = makeDispatch()

    const { result } = renderHook(() =>
      useOrderPlanningStepNavigation({
        steps: [{ id: 'client_order' }, { id: 'cargo' }],
        activeStepIndex: 0,
        criticalIssuesCount: 0,
        trigger,
        dispatch,
      }),
    )

    await act(async () => { await result.current.nextStep() })

    expect(dispatched).toContainEqual({ type: 'STEP_VALIDATION_FAILED' })
    expect(dispatched).not.toContainEqual(expect.objectContaining({ type: 'GO_TO_STEP' }))
  })

  it('ignores out-of-range goToStep indices', () => {
    const { dispatch, dispatched } = makeDispatch()

    const { result } = renderHook(() =>
      useOrderPlanningStepNavigation({
        steps: [{ id: 'client_order' }, { id: 'cargo' }],
        activeStepIndex: 0,
        criticalIssuesCount: 0,
        trigger: vi.fn(async () => true),
        dispatch,
      }),
    )

    act(() => {
      result.current.goToStep(-1)
      result.current.goToStep(999)
    })

    expect(dispatched).toHaveLength(0)
  })

  it('returns true on summary step without dispatching or calling trigger', async () => {
    const trigger = vi.fn(async () => true)
    const { dispatch, dispatched } = makeDispatch()

    const { result } = renderHook(() =>
      useOrderPlanningStepNavigation({
        steps: [{ id: 'summary' }],
        activeStepIndex: 0,
        criticalIssuesCount: 0,
        trigger,
        dispatch,
      }),
    )

    let nextResult = false
    await act(async () => { nextResult = await result.current.nextStep() })

    expect(nextResult).toBe(true)
    expect(trigger).not.toHaveBeenCalled()
    expect(dispatched).toHaveLength(0)
  })

  it('prevStep dispatches GO_TO_STEP with index - 1', () => {
    const { dispatch, dispatched } = makeDispatch()

    const { result } = renderHook(() =>
      useOrderPlanningStepNavigation({
        steps: [{ id: 'client_order' }, { id: 'cargo' }, { id: 'route' }],
        activeStepIndex: 2,
        criticalIssuesCount: 0,
        trigger: vi.fn(async () => true),
        dispatch,
      }),
    )

    act(() => { result.current.prevStep() })

    expect(dispatched).toContainEqual({ type: 'GO_TO_STEP', index: 1 })
  })
})
