import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold">Fleet Manager</h1>
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          count is {count}
        </button>
      </div>
    </div>
  )
}

export default App
