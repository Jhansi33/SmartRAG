import axios from 'axios';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!configuredApiBaseUrl && import.meta.env.PROD) {
  throw new Error('Missing VITE_API_BASE_URL. Set it to your deployed backend URL, for example: https://your-backend.onrender.com/api');
}

export const API_BASE_URL = configuredApiBaseUrl || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically inject the bearer token if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch authorization failures (expired tokens) and wipe states
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'The backend did not respond in time. Check that your deployed API is awake and connected to MongoDB.';
    } else if (!error.response) {
      error.message = `Cannot reach the backend at ${API_BASE_URL}. Check VITE_API_BASE_URL, backend deployment status, and CORS allowed origins.`;
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if on protected page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
