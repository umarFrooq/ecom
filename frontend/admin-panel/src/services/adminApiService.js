import axios from 'axios';

// Base URL for the backend API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
adminApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminAuthToken'); // Or however admin token is stored
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access, e.g., redirect to admin login
      // localStorage.removeItem('adminAuthToken');
      // window.location.href = '/admin/login'; // Or use history for SPA navigation
      console.warn('Admin API: Unauthorized. Token might be invalid or missing.');
    }
    return Promise.reject(error.response ? error.response.data : error.message);
  }
);

// --- Auth APIs (Admin Specific or Shared) ---
// Assuming admin login sets 'adminAuthToken' in localStorage
export const adminLogin = (credentials) => adminApiClient.post('/auth/login', credentials); // Uses the same login endpoint
export const getAdminProfile = () => adminApiClient.get('/auth/me'); // Uses the same /me endpoint

// --- Product Management APIs ---
// `params` can include page, limit, sort, search, category, isActive ('all' or true/false)
export const getAdminProducts = (params) => adminApiClient.get('/products', { params });
export const getAdminProductById = (id) => adminApiClient.get(`/products/${id}`); // Use ID not identifier for admin edits
export const createAdminProduct = (productData) => adminApiClient.post('/products', productData);
export const updateAdminProduct = (id, productData) => adminApiClient.put(`/products/${id}`, productData); // Backend uses :id for PUT
export const deleteAdminProduct = (id) => adminApiClient.delete(`/products/${id}`); // Backend uses :id for DELETE

// --- Category Management APIs ---
export const getAdminCategories = (params) => adminApiClient.get('/categories', { params });
export const getAdminCategoryById = (id) => adminApiClient.get(`/categories/${id}`);

export const createAdminCategory = (categoryData) => {
  const config = {};
  if (categoryData instanceof FormData) {
    config.headers = { 'Content-Type': 'multipart/form-data' };
  }
  // If not FormData, it will use the default 'application/json' from adminApiClient instance's defaults
  return adminApiClient.post('/categories', categoryData, config);
};

export const updateAdminCategory = (id, categoryData) => {
  const config = {};
  if (categoryData instanceof FormData) {
    config.headers = { 'Content-Type': 'multipart/form-data' };
  }
  // If not FormData, it will use the default 'application/json' from adminApiClient instance's defaults
  return adminApiClient.put(`/categories/${id}`, categoryData, config);
};

export const deleteAdminCategory = (id) => adminApiClient.delete(`/categories/${id}`);

// --- Order Management APIs ---
export const getAdminOrders = (params) => adminApiClient.get('/orders', { params });
export const getAdminOrderById = (id) => adminApiClient.get(`/orders/${id}`);
export const updateAdminOrderStatus = (id, statusData) => adminApiClient.put(`/orders/${id}/status`, statusData);
export const markOrderAsDelivered = (id) => adminApiClient.put(`/orders/${id}/deliver`);

// --- User Management APIs ---
export const getAdminUsers = (params) => adminApiClient.get('/auth/users', { params }); // Route is /api/auth/users
// TODO: Add functions for admin to update user role/status, delete user
// export const updateAdminUser = (id, userData) => adminApiClient.put(`/auth/users/${id}`, userData);
// export const deleteAdminUser = (id) => adminApiClient.delete(`/auth/users/${id}`);


// --- Project Content Management APIs ---
export const getAdminProjects = (params) => adminApiClient.get('/projects', { params: {...params, status: 'all'} }); // Ensure admin sees all
export const getAdminProjectById = (id) => adminApiClient.get(`/projects/${id}`); // Use ID for admin edits
export const createAdminProject = (projectData) => adminApiClient.post('/projects', projectData);
// Note: Project routes for PUT/DELETE are /:id/manage
export const updateAdminProject = (id, projectData) => adminApiClient.put(`/projects/${id}/manage`, projectData);
export const deleteAdminProject = (id) => adminApiClient.delete(`/projects/${id}/manage`);

// --- File Upload API ---
export const uploadAdminImage = (file) => {
  const formData = new FormData();
  formData.append('image', file); // 'image' must match the field name in backend (multer)
  return adminApiClient.post('/v1/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// --- Contact Messages ---
export const getContactMessages = () => adminApiClient.get('/contact');

export default adminApiClient;
