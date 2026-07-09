import api from '../api/axios';

export default api;

export async function httpClient(path, options = {}) {
  const response = await api.request({
    url: path,
    ...options,
  });

  return response.data;
}