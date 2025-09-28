import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Provider } from 'react-redux'
import { ConfirmProvider } from '@/context/ConfirmContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { store } from '@/store'
import { fetchSession } from '@/store/slices/sessionSlice'
import { fetchCart } from '@/store/slices/cartSlice'
import { Toaster } from 'sonner'

store.dispatch(fetchSession())
  .then(() => {
    const state = store.getState()
    if (state.session.user) {
      store.dispatch(fetchCart())
    }
  })
  .catch(() => {})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <ConfirmProvider>
          <Toaster richColors position="top-right" theme="light" closeButton />
          <App />
        </ConfirmProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
)
