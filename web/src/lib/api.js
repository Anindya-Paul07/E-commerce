const origin = (import.meta.env?.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const BASE = `${origin}/api`;

async function req(path, opts = {}) {
  const { body, headers, ...rest } = opts
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  })
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  get: (p, options) => req(p, { ...(options || {}), method: 'GET' }),
  post: (p, body, options) => req(p, { ...(options || {}), method: 'POST', body }),
  patch: (p, body, options) => req(p, { ...(options || {}), method: 'PATCH', body }),
  delete: (p, options) => req(p, { ...(options || {}), method: 'DELETE' })
};
