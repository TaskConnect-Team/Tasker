import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');

console.log("baseURL :", baseURL)

if (!baseURL) {
  throw new Error('VITE_API_URL is not configured. Set it in your environment files.');
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;