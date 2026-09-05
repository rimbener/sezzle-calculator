import { Display, Key, Keypad } from '@repo/ui'
import { useReducer } from 'react'
import { toDisplay } from './display'
import { type CalculatorKey, KEYS } from './keys'
import { actionFor, reducer } from './reducer'
import { INITIAL_STATE } from './state'

export function Calculator() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const readout = toDisplay(state)

  const press = (key: CalculatorKey) => {
    const action = actionFor(key)
    if (action) dispatch(action)
  }

  return (
    <section className="calculator" aria-label="Calculator">
      <Display size="lg" value={readout.value} expression={readout.expression} state={readout.state} />
      <Keypad>
        {KEYS.map(key => (
          <Key key={key.name} face={key.face} label={key.label} ariaLabel={key.name} onPress={() => press(key)} />
        ))}
      </Keypad>
    </section>
  )
}
