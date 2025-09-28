import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SellerListingsPage from '@/pages/seller/listings';

vi.mock('@/components/SellerGate', () => ({
  default: ({ children }) => <>{children}</>,
}));

const mockGet = vi.fn((url) => {
  if (url === '/sellers/listings') {
    return Promise.resolve({ items: [] });
  }
  if (url.startsWith('/catalog/products?')) {
    return Promise.resolve({ items: [{ _id: 'catalog-1', name: 'Premium Laptop', brand: 'Acme' }] });
  }
  if (url === '/catalog/products/catalog-1') {
    return Promise.resolve({
      product: { _id: 'catalog-1', name: 'Premium Laptop', slug: 'premium-laptop' },
      variants: [
        { _id: 'var-1', sku: 'SKU-123', title: '128GB', status: 'active' },
        { _id: 'var-2', sku: 'SKU-456', title: '256GB', status: 'active' },
      ],
    });
  }
  return Promise.resolve({});
});

const mockPost = vi.fn(() => Promise.resolve({}));
const mockPatch = vi.fn(() => Promise.resolve({}));
const mockDelete = vi.fn(() => Promise.resolve({}));

vi.mock('@/lib/api', () => ({
  api: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
    patch: (...args) => mockPatch(...args),
    delete: (...args) => mockDelete(...args),
  },
}));

vi.mock('@/lib/notify', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SellerListingsPage', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockPost.mockClear();
    mockPatch.mockClear();
    mockDelete.mockClear();
  });

  it('loads catalog variants when a product is selected', async () => {
    render(
      <MemoryRouter>
        <SellerListingsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/sellers/listings'));

    const catalogSelect = await screen.findByLabelText(/catalog product/i);
    await userEvent.selectOptions(catalogSelect, 'catalog-1');

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/catalog/products/catalog-1'));

    const priceInputs = await screen.findAllByPlaceholderText(/price/i);
    expect(priceInputs).toHaveLength(2);
  });
});

