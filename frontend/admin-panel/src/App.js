import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Container, Col, Form, Alert, Button, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async'; // Import HelmetProvider
import AdminLayout from './components/Layout/AdminLayout';
import './App.css';
import { useAdminAuth } from './contexts/AdminAuthContext'; // Import useAdminAuth

import ProductListPage from './pages/Products/ProductListPage';
import ProductFormPage from './pages/Products/ProductFormPage'; // Import ProductFormPage

import CategoryListPage from './pages/Categories/CategoryListPage';
import CategoryFormPage from './pages/Categories/CategoryFormPage';
import OrderListPage from './pages/Orders/OrderListPage';
import OrderDetailPage from './pages/Orders/OrderDetailPage';
import UserListPage from './pages/Users/UserListPage';
import ProjectListPage from './pages/Projects/ProjectListPage'; // Import ProjectListPage
import ProjectFormPage from './pages/Projects/ProjectFormPage'; // Import ProjectFormPage
import ContactMessagesPage from './pages/Contact/ContactMessagesPage';


// Placeholder Page Components for Admin Panel
const AdminDashboardPage = () => <div><Helmet><title>Dashboard</title></Helmet><h2>Admin Dashboard</h2></div>;
// const AdminProjectsContentPage = () => <div><Helmet><title>Manage Projects Content</title></Helmet><h2>Manage Projects Content</h2></div>; // Replaced
const AdminHomepageContentPage = () => <div><Helmet><title>Manage Homepage Content</title></Helmet><h2>Manage Homepage Content</h2></div>;
const AdminAnalyticsPage = () => <div><Helmet><title>Analytics</title></Helmet><h2>Analytics</h2></div>;
const AdminSettingsPage = () => <div><Helmet><title>Settings</title></Helmet><h2>Settings</h2></div>;
const AdminNotFoundPage = () => <div><Helmet><title>Not Found</title></Helmet><h2>404 - Admin Page Not Found</h2></div>;

// Updated AdminLoginPage to use AdminAuthContext
const AdminLoginPage = () => {
  const { t } = useTranslation();
  const { login, loading, error: authError, setError: setAuthError } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation(); // To redirect after login
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  useEffect(() => {
    setAuthError(null); // Clear previous errors on mount
  }, [setAuthError]);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(credentials);
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      // Error is handled by AdminAuthContext and displayed via authError
      console.error("Admin login error:", err);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Col md={6} lg={4}>
        <Helmet><title>{t('adminPanel.loginTitle', 'Admin Login')}</title></Helmet>
        <h2 className="text-center mb-4">{t('adminPanel.loginTitle', 'Admin Login')}</h2>
        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-3" controlId="adminEmail">
            <Form.Label>{t('adminPanel.form.email', 'Email or Username')}</Form.Label>
            <Form.Control type="text" name="email" value={credentials.email} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3" controlId="adminPassword">
            <Form.Label>{t('adminPanel.form.password', 'Password')}</Form.Label>
            <Form.Control type="password" name="password" value={credentials.password} onChange={handleChange} required />
          </Form.Group>
          {authError && <Alert variant="danger">{authError}</Alert>}
          <div className="d-grid">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? <Spinner as="span" animation="border" size="sm" /> : t('adminPanel.loginButton', 'Log In')}
            </Button>
          </div>
        </Form>
      </Col>
    </Container>
  );
};

// Updated ProtectedRoute to use AdminAuthContext
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, adminUser } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Optional: Role check if needed for general admin area access beyond just being authenticated
  // For example, if 'customer' role should not access /admin/* at all.
  // The AdminAuthContext already tries to ensure only admin/editor roles are set in adminUser.
  if (!adminUser || !['admin', 'editor'].includes(adminUser.role)) {
     console.warn("Protected Route: User does not have admin/editor role.", adminUser);
     // Potentially logout or redirect to a specific unauthorized page for admin
     return <Navigate to="/admin/login" state={{ from: location }} replace />; // Or a more specific error page
  }

  return children;
};


function App() {
  const { i18n, t } = useTranslation();

  React.useEffect(() => {
    document.body.dir = i18n.dir();
    document.documentElement.lang = i18n.language;
  }, [i18n, i18n.language]);

  const adminBaseTitle = t('adminPanel.title', 'Admin Panel');

  return (
    <HelmetProvider> {/* Add HelmetProvider here */}
      <Router>
        <Helmet titleTemplate={`%s | ${adminBaseTitle}`} defaultTitle={adminBaseTitle}>
          <meta name="description" content={t('adminPanel.description', 'Administration panel for the website.')} />
        </Helmet>
        <Routes>
          {/* Redirect root to /admin */}
          <Route path="/" element={<Navigate to="/admin" replace />} />

          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Routes protected by AdminLayout and authentication */}
          <Route
            path="/admin/*" // All routes starting with /admin/ will use AdminLayout
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="products" element={<ProductListPage />} />
                    <Route path="products/new" element={<ProductFormPage />} />
                    <Route path="products/edit/:productId" element={<ProductFormPage />} />
                    <Route path="categories" element={<CategoryListPage />} />
                    <Route path="categories/new" element={<CategoryFormPage />} />
                    <Route path="categories/edit/:categoryId" element={<CategoryFormPage />} />
                    <Route path="orders" element={<OrderListPage />} />
                    <Route path="orders/view/:orderId" element={<OrderDetailPage />} />
                    <Route path="users" element={<UserListPage />} />
                    <Route path="contact-messages" element={<ContactMessagesPage />} />
                    <Route path="projects-content" element={<ProjectListPage />} />
                    <Route path="projects-content/new" element={<ProjectFormPage />} />
                    <Route path="projects-content/edit/:projectId" element={<ProjectFormPage />} />
                    <Route path="homepage-content" element={<AdminHomepageContentPage />} />
                    <Route path="analytics" element={<AdminAnalyticsPage />} />
                    <Route path="settings" element={<AdminSettingsPage />} />
                    <Route index element={<Navigate to="dashboard" replace />} /> {/* Default to dashboard */}
                    <Route path="*" element={<AdminNotFoundPage />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          {/* Redirect root /admin to /admin/dashboard if authenticated, else to /admin/login */}
          <Route
            path="/admin"
            element={ // This logic might be better handled by a root /admin route that checks auth context
              <ProtectedRoute>
                <Navigate to="/admin/dashboard" replace />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;
