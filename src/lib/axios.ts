import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Always send cookies
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // We handle 401 errors in the AuthContext through a dedicated interceptor
    // This is for other types of errors
    if (error.response && error.response.status === 403) {
      // Handle forbidden errors
      console.error('Access forbidden:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api; 