import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App.tsx'
import { initializeGlobalErrorHandlers } from '@/hooks/useErrorHandler'

// Initialize global error handlers before app mount
initializeGlobalErrorHandlers({
  enableConsole: true,
  enableReporting: false,
})

// Log initialization
console.info('[App] Global error handlers initialized')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    <Toaster position="top-right" richColors />
  </StrictMode>,
)
