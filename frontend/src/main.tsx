import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import './index.css'
import App from './App.tsx'

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 border border-red-100">
        <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-600 mb-4 font-mono break-all">{error.message}</p>
        <button 
          onClick={resetErrorBoundary}
          className="bg-red-50 text-red-600 px-4 py-2 rounded-md font-medium hover:bg-red-100 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
