import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import App from './App.tsx'
import { QueryProvider, AlertProvider } from '@client/shared/providers'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AlertProvider>
        <App />
      </AlertProvider>
    </QueryProvider>
  </StrictMode>,
)
