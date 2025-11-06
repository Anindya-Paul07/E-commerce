const BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '/api';
const USE_MOCK_API = String(import.meta.env.VITE_USE_MOCK_API || '').toLowerCase() === 'true';

const MOCK_GET_ROUTES = {
  '/homepage': '/mock/homepage.json',
  '/products': '/mock/products.json',
  '/categories': '/mock/categories.json',
  '/stats': '/mock/stats.json',
};

let TOKEN = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

export function setToken(token) {
  TOKEN = token || null;
  if (typeof localStorage === 'undefined') return;
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

async function request(method, path, data, config = {}) {
  const { headers = {}, isForm = false, ...rest } = config;
  const upperMethod = method.toUpperCase();
  const [cleanPath] = path.split('?');

  if (USE_MOCK_API && upperMethod === 'GET') {
    const mockEndpoint = MOCK_GET_ROUTES[cleanPath];
    if (mockEndpoint) {
      const response = await fetch(mockEndpoint, { credentials: 'omit' });
      if (!response.ok) {
        const err = new Error(`Mock response failed for ${cleanPath}`);
        err.status = response.status;
        throw err;
      }
      return response.json();
    }
  }

  const fetchOptions = {
    method: upperMethod,
    credentials: 'include',
    ...rest,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  };

  if (isForm) {
    fetchOptions.body = data instanceof FormData ? data : data ?? undefined;
  } else if (typeof data !== 'undefined') {
    fetchOptions.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE}${path}`, fetchOptions);
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage = payload?.error || payload?.message || response.statusText;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function withFormConfig(config = {}) {
  return { ...config, isForm: true };
}

export const api = {
  get: (path, config) => request('get', path, undefined, config),
  post: (path, data, config) => request('post', path, data, config),
  patch: (path, data, config) => request('patch', path, data, config),
  put: (path, data, config) => request('put', path, data, config),
  delete: (path, config) => request('delete', path, undefined, config),
  del: (path, config) => request('delete', path, undefined, config),
  postForm: (path, data, config) => request('post', path, data, withFormConfig(config)),
  patchForm: (path, data, config) => request('patch', path, data, withFormConfig(config)),
};
