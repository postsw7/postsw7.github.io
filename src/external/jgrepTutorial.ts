import { trackDemoStep } from '../core/analytics'
import { JGREP_DEMO_STEPS } from '../core/constants'

export interface TutorialState {
  index: number
  done: boolean
}

export function createTutorialState(): TutorialState {
  return { index: -1, done: false }
}

export function nextStep(
  state: TutorialState,
): { stepText: string; title: string; blurb: string } | null {
  if (state.done) return null
  const next = state.index + 1
  if (next >= JGREP_DEMO_STEPS.length) {
    state.done = true
    return null
  }
  state.index = next
  const step = JGREP_DEMO_STEPS[next]
  trackDemoStep('jgrep', step.idx)
  return { stepText: step.command, title: step.title, blurb: step.blurb }
}

export function remaining(state: TutorialState): number {
  if (state.done) return 0
  return JGREP_DEMO_STEPS.length - (state.index + 1)
}

export function stepsTotal(): number {
  return JGREP_DEMO_STEPS.length
}
