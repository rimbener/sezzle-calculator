import { OPERATIONS } from '@repo/contracts'
import { describe, expect, it } from 'vitest'
import { KEYS } from './keys'

describe('keys — the key model (AC-2)', () => {
  it('has exactly one operation key per contract operation, carrying the contract name', () => {
    const operationKeys = KEYS.filter(key => key.kind === 'operation')

    expect(operationKeys.map(key => key.operation).sort()).toEqual([...OPERATIONS].sort())
  })
})
