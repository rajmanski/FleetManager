import { EMPTY_SECTION_ERRORS, type SectionErrors, type SubmissionState } from './orderPlanningFlowTypes'

export type FlowState = {
  activeStepIndex: number
  submissionState: SubmissionState
  routeFlowError: string | null
  backendSectionErrors: SectionErrors
  lastErrorSource: 'none' | 'backend' | 'local'
}

export type FlowAction =
  | { type: 'GO_TO_STEP'; index: number }
  | { type: 'STEP_VALIDATION_FAILED' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'BUILD_FAILED'; routeError: string }
  | { type: 'BACKEND_FAILED'; backendErrors: SectionErrors; routeError: string | null; stepIndex: number }
  | { type: 'RESET_ERRORS' }

export const INITIAL_FLOW_STATE: FlowState = {
  activeStepIndex: 0,
  submissionState: 'idle',
  routeFlowError: null,
  backendSectionErrors: EMPTY_SECTION_ERRORS,
  lastErrorSource: 'none',
}

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'GO_TO_STEP':
      return { ...state, activeStepIndex: action.index }

    case 'STEP_VALIDATION_FAILED':
      return { ...state, submissionState: 'partial_validation' }

    case 'SUBMIT_START':
      return {
        ...state,
        submissionState: 'loading',
        routeFlowError: null,
        backendSectionErrors: EMPTY_SECTION_ERRORS,
      }

    case 'SUBMIT_SUCCESS':
      return { ...state, submissionState: 'idle' }

    case 'BUILD_FAILED':
      return {
        ...state,
        submissionState: 'partial_validation',
        routeFlowError: action.routeError,
        lastErrorSource: 'local',
        activeStepIndex: 1,
      }

    case 'BACKEND_FAILED':
      return {
        ...state,
        submissionState: 'retry',
        backendSectionErrors: action.backendErrors,
        routeFlowError: action.routeError,
        lastErrorSource: 'backend',
        activeStepIndex: action.stepIndex >= 0 ? action.stepIndex : state.activeStepIndex,
      }

    case 'RESET_ERRORS':
      return {
        ...state,
        submissionState: 'idle',
        routeFlowError: null,
        backendSectionErrors: EMPTY_SECTION_ERRORS,
        lastErrorSource: 'none',
      }

    default:
      return state
  }
}
