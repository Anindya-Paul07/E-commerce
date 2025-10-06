import axios from 'axios';

const origin = (import.meta.env?.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export const http = axios.create({
  baseURL: `${origin}/api`,
  withCredentials: true,
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.error || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

function request(method, url, data, config = {}) {
  return http({ method, url, data, ...config }).then((res) => res.data);
}

function withFormConfig(config = {}) {
  return { ...config };
}

export const api = {
  get: (url, config) => request('get', url, undefined, config),
  post: (url, data, config) => request('post', url, data, config),
  patch: (url, data, config) => request('patch', url, data, config),
  put: (url, data, config) => request('put', url, data, config),
  delete: (url, config) => request('delete', url, undefined, config),
  del: (url, config) => request('delete', url, undefined, config),
  postForm: (url, data, config) => request('post', url, data, withFormConfig(config)),
  patchForm: (url, data, config) => request('patch', url, data, withFormConfig(config)),
};
