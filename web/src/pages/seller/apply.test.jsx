import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter } from 'react-router-dom'

import SellerApplicationPage from './apply.jsx'
import sessionReducer from '@/store/slices/sessionSlice.js'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    postForm: vi.fn(),
  },
}))

vi.mock('@/lib/notify', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    promise: vi.fn(),
  },
  toast: {},
}))

const { api } = await import('@/lib/api')
const { notify } = await import('@/lib/notify')

function renderPage({ user } = {}) {
  const resolvedUser = user === undefined ? { id: 'user-1', email: 'owner@example.com', roles: ['customer'] } : user
  const store = configureStore({
    reducer: {
      session: sessionReducer,
    },
    preloadedState: {
      session: {
        user: resolvedUser,
        status: 'idle',
        error: null,
      },
    },
  })

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <SellerApplicationPage />
      </MemoryRouter>
    </Provider>
  )
}

describe('SellerApplicationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ content: {} })
  })

  it('shows a validation error when the display name is missing', async () => {
    renderPage()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /submit application/i }))

    expect(screen.getByText(/display name is required/i)).toBeInTheDocument()
    expect(api.postForm).not.toHaveBeenCalled()
  })

  it('submits the form and shows a success message', async () => {
    api.postForm.mockResolvedValue({ seller: { id: 'seller-1' } })

    renderPage()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/display name/i), 'Acme Sellers')
    await user.type(screen.getByLabelText(/contact email/i), 'owner@acme.test')

    await user.click(screen.getByRole('button', { name: /submit application/i }))

    await waitFor(() => expect(api.postForm).toHaveBeenCalledTimes(1))
    const [path, formData] = api.postForm.mock.calls[0]
    expect(path).toBe('/sellers/apply')
    expect(formData.get('displayName')).toBe('Acme Sellers')
    expect(JSON.parse(formData.get('contact'))).toEqual({ email: 'owner@acme.test' })
    expect(notify.success).toHaveBeenCalled()
    expect(screen.getByText(/application was submitted/i)).toBeInTheDocument()
  })

  it('prompts unauthenticated visitors to sign in', async () => {
    renderPage({ user: null })

    expect(await screen.findByRole('heading', { name: /launch your flagship/i })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /start application/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /submit application/i })).not.toBeInTheDocument()
  })
})
