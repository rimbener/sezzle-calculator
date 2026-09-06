import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import * as useCalculateModule from './api/useCalculate'

const mockChildProps = vi.fn()
vi.mock('./calculator/Calculator', () => ({
  Calculator: (props: { onRequest: () => void }) => {
    mockChildProps(props)
    return <div data-testid="calculator" />
  },
}))

describe('App', () => {
  it('renders the calculator and passes the onRequest prop to the Calculator component', () => {
    render(<App />)
    expect(mockChildProps).toHaveBeenCalledWith(
      expect.objectContaining({
        onRequest: expect.any(Function),
      }),
    )
  })

  it('uses the useCalculate hook to get the onRequest prop', () => {
    const spyOnRequest = vi.spyOn(useCalculateModule, 'useCalculate')
    render(<App />)
    expect(spyOnRequest).toHaveBeenCalled()
  })

  it('no longer renders the design-system gallery anywhere', () => {
    render(<App />)

    expect(screen.queryByRole('heading', { name: 'Design System Gallery' })).toBeNull()
  })
})
