export function buildFormData(fields = {}, files = {}) {
  const formData = new FormData();

  const appendValue = (key, value) => {
    if (value === undefined || value === null) return;

    if (value instanceof Blob) {
      formData.append(key, value);
      return;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        // send an empty array marker so the backend can differentiate "no value" vs "clear value"
        formData.append(key, '[]');
        return;
      }
      value.forEach((entry) => appendValue(key, entry));
      return;
    }

    if (typeof value === 'object' && !(value instanceof Date)) {
      Object.entries(value).forEach(([childKey, childValue]) => {
        appendValue(`${key}[${childKey}]`, childValue);
      });
      return;
    }

    formData.append(key, value);
  };

  Object.entries(fields).forEach(([key, value]) => appendValue(key, value));

  Object.entries(files).forEach(([key, value]) => {
    if (!value) return;
    const list = Array.isArray(value) ? value : [value];
    list.filter(Boolean).forEach((file) => formData.append(key, file));
  });

  return formData;
}
