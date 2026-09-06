import { describe, expect, it } from 'vitest'
import { ERROR_MESSAGES } from '@repo/contracts'
import { readoutFitStep } from '@repo/ui/display'
import { NETWORK_MESSAGE, OUTAGE_MESSAGE, UNEXPECTED_MESSAGE } from '../api/client.constants'
import { OPERAND_MAX_LENGTH } from './reducer'

// The ladder's CSS is pinned in @repo/ui's display.test.tsx; its tail step wraps past 59 characters.
describe('every producible readout value lands on the fit ladder (AC-3)', () => {
  const longestNumberString = String(-Number.MAX_VALUE)
  const values = [
    '7'.repeat(OPERAND_MAX_LENGTH),
    longestNumberString,
    ...Object.values(ERROR_MESSAGES),
    OUTAGE_MESSAGE,
    NETWORK_MESSAGE,
    UNEXPECTED_MESSAGE,
  ]

  it('pins the extremes by name and length', () => {
    expect(longestNumberString).toHaveLength(24)
    expect(OUTAGE_MESSAGE).toHaveLength(53)
  })

  it('each producible value sits within the ladder', () => {
    for (const value of values) {
      expect(readoutFitStep(value), `"${value}" (${value.length} chars)`).toBeLessThanOrEqual(10)
    }
  })
})
