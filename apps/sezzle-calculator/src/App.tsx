import './App.css'
import { useCalculate } from './api/useCalculate'
import { Calculator } from './calculator/Calculator'

function App() {
  const onRequest = useCalculate()
  return <Calculator onRequest={onRequest} />
}

export default App
