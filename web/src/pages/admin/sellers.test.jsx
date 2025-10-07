import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import AdminSellerReviewPage from './sellers.jsx'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
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
const { notify } = await import('@/lib/notify')

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminSellerReviewPage />
    </MemoryRouter>
  )
}

describe('AdminSellerReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads pending sellers and approves an application', async () => {
    api.get
      .mockResolvedValueOnce({
        items: [
          {
            _id: 'seller-1',
            displayName: 'Acme Sellers',
            legalName: 'Acme Corp',
            status: 'pending',
            verificationStatus: 'pending',
            createdAt: '2025-01-15T12:00:00.000Z',
            contact: { email: 'owner@acme.test', phone: '+1 555 000 1234' },
            user: { email: 'owner@acme.test' },
          },
        ],
        total: 1,
        page: 1,
        pages: 1,
      })
      .mockResolvedValueOnce({ items: [], total: 0, page: 1, pages: 1 })

    api.patch.mockResolvedValue({ seller: { _id: 'seller-1', status: 'approved', verificationStatus: 'verified' } })

    renderPage()

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/admin/sellers?status=pending')
    })

    const approveButton = await screen.findByRole('button', { name: /approve/i })

    const user = userEvent.setup()
    await user.click(approveButton)

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/admin/sellers/seller-1/status', {
        status: 'approved',
        verificationStatus: 'verified',
      })
    })

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2))
    expect(notify.success).toHaveBeenCalledWith('Seller status updated')
    expect(screen.queryByText('Acme Sellers')).not.toBeInTheDocument()
  })

  it('applies filters when the admin submits the filter form', async () => {
    api.get.mockResolvedValue({ items: [], total: 0, page: 1, pages: 1 })

    renderPage()

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/admin/sellers?status=pending')
    })

    const user = userEvent.setup()

    await user.selectOptions(screen.getByLabelText(/status/i), 'approved')
    await user.selectOptions(screen.getByLabelText(/verification/i), 'verified')
    await user.type(screen.getByLabelText(/search/i), 'Acme')
    await user.click(screen.getByRole('button', { name: /^apply$/i }))

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith('/admin/sellers?status=approved&verificationStatus=verified&q=Acme')
    })
  })
})

