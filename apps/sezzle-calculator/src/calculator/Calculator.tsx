import type { CalculateRequest } from '@repo/contracts'
import { Display, Key, Keypad } from '@repo/ui'
import { useEffect, useReducer, useRef } from 'react'
import { toDisplay } from './display'
import { KEYS } from './keys'
import { actionFor, reducer } from './reducer'
import { type CalculationOutcome, INITIAL_STATE } from './state'

export interface CalculatorProps {
  /**
   * The boundary Phase 4 plugs into (`spec.md`, approach): answers one emitted request with an outcome — the
   * contract's `{ result }` or `{ error: { code, message } }` — and never rejects. Omitted, `=` leaves the
   * calculator pending: the running app's dead end until the API client lands.
   */
  onRequest?: (request: CalculateRequest) => Promise<CalculationOutcome>
}

export function Calculator({ onRequest }: CalculatorProps) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const readout = toDisplay(state)
  const request = state.status === 'pending' ? state.request : undefined
  // Each request leaves exactly once, StrictMode's dev-only effect replay included.
  const sent = useRef<CalculateRequest>(undefined)

  useEffect(() => {
    if (!request || !onRequest || sent.current === request) return
    sent.current = request
    void onRequest(request).then(outcome => dispatch({ type: 'outcome', outcome }))
  }, [request, onRequest])

  return (
    <section className="calculator" aria-label="Calculator">
      <Display size="lg" value={readout.value} expression={readout.expression} state={readout.state} />
      <Keypad>
        {KEYS.map(key => (
          <Key key={key.name} face={key.face} label={key.label} ariaLabel={key.name} onPress={() => dispatch(actionFor(key))} />
        ))}
      </Keypad>
    </section>
  )
}
