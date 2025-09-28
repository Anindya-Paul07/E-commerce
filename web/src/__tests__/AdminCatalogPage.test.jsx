import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminCatalogPage from '@/pages/admin/catalog';

const mockGet = vi.fn((url) => {
  if (url.startsWith('/admin/catalog/products?')) {
    return Promise.resolve({ items: [] });
  }
  if (url.startsWith('/admin/catalog/products/')) {
    return Promise.resolve({
      product: {
        _id: 'prod1',
        name: 'Sample Product',
        brand: 'Sample',
        description: 'Desc',
        status: 'active',
        moderationState: 'approved',
        lifecycle: 'active',
        attributes: { color: 'Blue' },
      },
      variants: [
        {
          _id: 'var1',
          sku: 'SKU-1',
          status: 'active',
          pricing: { currency: 'USD', listPrice: 10, compareAtPrice: null },
        },
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

describe('AdminCatalogPage', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockPost.mockClear();
    mockPatch.mockClear();
    mockDelete.mockClear();
  });

  it('allows adding catalog attribute rows in creation form', async () => {
    render(
      <MemoryRouter>
        <AdminCatalogPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/admin/catalog/products?limit=50'));

    const addRowButton = screen.getAllByRole('button', { name: /add row/i })[0];
    await userEvent.click(addRowButton);

    const attributeInputs = screen.getAllByPlaceholderText(/attribute key/i);
    expect(attributeInputs).toHaveLength(2);
  });
});

