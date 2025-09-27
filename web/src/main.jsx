import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { SessionProvider } from '@/context/SessionContext'
import { ConfirmProvider } from '@/context/ConfirmContext'
import { Toaster } from 'sonner'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SessionProvider>
      <ConfirmProvider>
        <Toaster richColors position="top-right" theme="light" closeButton />
        <App />
      </ConfirmProvider>
    </SessionProvider>
  </React.StrictMode>
)
