import './App.css'
import { useCalculate } from './api/useCalculate'
import { Calculator } from './calculator/Calculator'

// Tested for real — App.integration.test.tsx renders this component end to end
// against a stubbed fetch — but the React Compiler rewrites the body into a
// memo-cache block that maps to no original statement, so V8 coverage cannot
// attribute its ranges: one line always reads as uncovered no matter the shape.
/* v8 ignore start */
function App() {
  const onRequest = useCalculate()
  return <Calculator onRequest={onRequest} />
}
/* v8 ignore stop */

export default App
