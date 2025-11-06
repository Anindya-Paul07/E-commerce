import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Provider } from 'react-redux'
import { ConfirmProvider } from '@/context/ConfirmContext'
import { store } from '@/store'
import { fetchSession } from '@/store/slices/sessionSlice'
import { fetchCart } from '@/store/slices/cartSlice'
import { Toaster } from 'sonner'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'

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
      <ConfirmProvider>
        <ThemeProvider>
          <ThemeAwareToaster />
          <App />
        </ThemeProvider>
      </ConfirmProvider>
    </Provider>
  </React.StrictMode>
)

function ThemeAwareToaster() {
  const { mode } = useTheme()
  return <Toaster richColors position="top-right" theme={mode === 'night' ? 'dark' : 'light'} closeButton />
}
