import axios from 'axios';

// Determine the base URL based on the environment
// In a real deployment, this would come from environment variables.
// For local development, backend often runs on a different port.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests if available (e.g., from localStorage or context)
apiClient.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem('authToken'); // Example: get token from localStorage
    // if (token) {
    //   config.headers['Authorization'] = `Bearer ${token}`;
    // }
    // For now, we'll manage token injection per call or when auth context is set up.
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Generic error handler for API responses (optional, can be handled per call)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors or re-throw for component-level handling
    // For example, redirect to login on 401 Unauthorized
    if (error.response && error.response.status === 401) {
      // console.warn('Unauthorized request. Redirecting to login...');
      // window.location.href = '/account/login'; // Or use history.push with React Router
    }
    // You might want to log errors or show a generic error message to the user
    // console.error('API Error:', error.response || error.message);
    return Promise.reject(error.response ? error.response.data : error.message);
  }
);


// --- Product APIs ---
export const getProducts = (params) => apiClient.get('/products', { params }); // params for pagination, filter, sort
export const getProductByIdentifier = (identifier) => apiClient.get(`/products/${identifier}`);

// --- Category APIs ---
export const getCategories = () => apiClient.get('/categories');
export const getCategoryById = (id) => apiClient.get(`/categories/${id}`);

// --- Review APIs ---
// Get reviews for a specific product
export const getProductReviews = (productId, params) => apiClient.get(`/products/${productId}/reviews`, { params });
// Add a review for a product (requires auth)
export const addProductReview = (productId, reviewData, token) => apiClient.post(`/products/${productId}/reviews`, reviewData, {
  headers: { Authorization: `Bearer ${token}` }
});

// --- Project APIs ---
export const getProjects = (params) => apiClient.get('/projects', { params });
export const getProjectByIdentifier = (identifier) => apiClient.get(`/projects/${identifier}`);

// --- Auth APIs ---
export const loginUser = (credentials) => apiClient.post('/auth/login', credentials);
export const registerUser = (userData) => apiClient.post('/auth/register', userData);
export const getMe = (token) => apiClient.get('/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
});
export const updateUserDetails = (userData, token) => apiClient.put('/auth/me/details', userData, {
  headers: { Authorization: `Bearer ${token}` }
});
export const forgotPassword = (emailData) => apiClient.post('/auth/forgotpassword', emailData);
export const resetPassword = (token, passwordData) => apiClient.put(`/auth/resetpassword/${token}`, passwordData);
export const logoutUser = (token) => apiClient.get('/auth/logout', { // Requires auth to logout (to invalidate server session if any)
    headers: { Authorization: `Bearer ${token}` }
});


// --- Contact Form API ---
export const submitContactForm = (contactData) => apiClient.post('/contact', contactData);


// --- Order APIs (Protected) ---
export const createOrder = (orderData, token) => apiClient.post('/orders', orderData, {
  headers: { Authorization: `Bearer ${token}` }
});
export const getOrderDetails = (orderId, token) => apiClient.get(`/orders/${orderId}`, {
  headers: { Authorization: `Bearer ${token}` }
});
export const getMyOrders = (token) => apiClient.get('/orders/myorders', {
  headers: { Authorization: `Bearer ${token}` }
});
export const payOrder = (orderId, paymentData, token) => apiClient.put(`/orders/${orderId}/pay`, paymentData, {
  headers: { Authorization: `Bearer ${token}` }
});


// Add other API functions as needed (e.g., Cart APIs when ready)

// --- Cart APIs (Protected) ---
export const getCart = (token) => apiClient.get('/cart', {
  headers: { Authorization: `Bearer ${token}` }
});

// The backend route for adding items is POST /api/cart/
export const addItemToCart = (itemData, token) => apiClient.post('/cart', itemData, {
  headers: { Authorization: `Bearer ${token}` }
});

// The backend route for updating/deleting specific items is /api/cart/item/:productId
export const updateCartItemQuantity = (productId, quantityData, token) => apiClient.put(`/cart/item/${productId}`, quantityData, { // This was correct
  headers: { Authorization: `Bearer ${token}` }
});

export const removeCartItem = (productId, token) => apiClient.delete(`/cart/item/${productId}`, { // Corrected from /items/ to /item/
  headers: { Authorization: `Bearer ${token}` }
});

export const clearCart = (token) => apiClient.delete('/cart', {
  headers: { Authorization: `Bearer ${token}` }
});

export default apiClient;
