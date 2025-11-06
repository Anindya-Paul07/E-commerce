import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

import SellerDashboard from './dashboard.jsx'
import SellerGate from '@/components/SellerGate'
import sessionReducer from '@/store/slices/sessionSlice.js'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

vi.mock('@/lib/notify', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    promise: vi.fn(),
  },
}))

const { api } = await import('@/lib/api')

function createStore(user) {
  return configureStore({
    reducer: {
      session: sessionReducer,
    },
    preloadedState: {
      session: {
        user,
        status: 'idle',
        error: null,
      },
    },
  })
}

describe('SellerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders metrics fetched from the API', async () => {
    api.get.mockResolvedValue({
      orders: { total: 5, itemsSold: 12, pendingFulfillment: 2, grossRevenue: 320.5 },
      listings: { total: 4, active: 3 },
      inventory: { totalOnHand: 80, totalReserved: 10, lowStock: 1 },
    })

    render(
      <MemoryRouter>
        <SellerDashboard />
      </MemoryRouter>
    )

    expect(screen.getByText(/seller overview/i)).toBeInTheDocument()
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/sellers/stats', expect.any(Object)))
    const ordersHeading = screen.getByRole('heading', { name: /total orders/i })
    expect(ordersHeading.parentElement?.parentElement).toHaveTextContent('5')
    expect(screen.getByRole('heading', { name: /items sold/i }).parentElement?.parentElement).toHaveTextContent('12')
    expect(screen.getByText('$320.50')).toBeInTheDocument()
    expect(screen.getByText((_, el) => el?.textContent === 'Active listings: 3')).toBeInTheDocument()
  })

  it('redirects users without the seller role', () => {
    const store = createStore({ id: 'user-1', roles: ['customer'] })

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/seller/dashboard']}>
          <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route
              path="/seller/dashboard"
              element={(
                <SellerGate>
                  <div>Seller Area</div>
                </SellerGate>
              )}
            />
          </Routes>
        </MemoryRouter>
      </Provider>
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.queryByText('Seller Area')).not.toBeInTheDocument()
  })

  it('renders protected content for sellers', () => {
    const store = createStore({ id: 'seller-1', roles: ['seller'] })

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/seller/dashboard']}>
          <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route
              path="/seller/dashboard"
              element={(
                <SellerGate>
                  <div>Seller Area</div>
                </SellerGate>
              )}
            />
          </Routes>
        </MemoryRouter>
      </Provider>
    )

    expect(screen.getByText('Seller Area')).toBeInTheDocument()
    expect(screen.queryByText('Home')).not.toBeInTheDocument()
  })
})
