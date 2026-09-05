import { Display, Key, Keypad } from '@repo/ui'
import { KEYS } from './keys'

export function Calculator() {
  return (
    <section className="calculator" aria-label="Calculator">
      <Display size="lg" value="0" expression="" />
      <Keypad>
        {KEYS.map(key => (
          <Key key={key.name} face={key.face} label={key.label} ariaLabel={key.name} />
        ))}
      </Keypad>
    </section>
  )
}
