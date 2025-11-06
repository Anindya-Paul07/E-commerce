export function httpError(status, message, extra = {}) {
  const e = new Error(message || String(status));
  e.status = status;
  Object.assign(e, extra);
  return e;
}