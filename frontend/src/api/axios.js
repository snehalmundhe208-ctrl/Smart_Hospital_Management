import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Pass along the authorization header if it exists in defaults
api.interceptors.request.use((config) => {
  const token = axios.defaults.headers.common['Authorization'];
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = token;
  }
  return config;
});

export default api;
