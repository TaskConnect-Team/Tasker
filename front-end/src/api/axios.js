import axios from 'axios';

const configuredBaseURL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
const fallbackBaseURL = import.meta.env.DEV ? 'http://localhost:3000' : '';
const baseURL = configuredBaseURL || fallbackBaseURL;

if (!configuredBaseURL) {
  console.warn(
    `VITE_API_URL is not configured. Using ${baseURL || 'relative URLs'} instead.`
  );
}

console.log("baseURL :", baseURL)

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;