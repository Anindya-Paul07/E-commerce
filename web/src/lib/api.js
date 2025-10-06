// Support both VITE_API_URL and VITE_API_BASE, else fall back to proxy path
const BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '/api')

let TOKEN = localStorage.getItem('token') || null
export function setToken(t) {
  TOKEN = t || null
  if (t) localStorage.setItem('token', t)
  else localStorage.removeItem('token')
}

async function req(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),   
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'include', 
  })
  const ct = r.headers.get('content-type') || ''
  const data = ct.includes('application/json') ? await r.json() : await r.text()
  if (!r.ok) throw new Error(data?.error || data?.message || r.statusText)
  return data
}

function withFormConfig(config = {}) {
  return { ...config };
}

export const api = {
<<<<<<< HEAD
  get: (p) => req(p),
  post: (p, body) => req(p, { method: 'POST', body }),
  patch: (p, body) => req(p, { method: 'PATCH', body }),
  delete: (p) => req(p, { method: 'DELETE' }),
}
=======
  get: (url, config) => request('get', url, undefined, config),
  post: (url, data, config) => request('post', url, data, config),
  patch: (url, data, config) => request('patch', url, data, config),
  put: (url, data, config) => request('put', url, data, config),
  delete: (url, config) => request('delete', url, undefined, config),
  del: (url, config) => request('delete', url, undefined, config),
  postForm: (url, data, config) => request('post', url, data, withFormConfig(config)),
  patchForm: (url, data, config) => request('patch', url, data, withFormConfig(config)),
};
>>>>>>> 3edd775 (added backend controllers)
