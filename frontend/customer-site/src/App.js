import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Removed BrowserRouter as Router
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import Layout from './components/Layout/Layout';
import LanguageSwitcher from './components/LanguageSwitcher/LanguageSwitcher'; // Will be removed from here, placed in a page or layout
import './App.css';

// Import Page Components
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProjectsPage from './pages/ProjectsPage';
import AboutUsPage from './pages/AboutUsPage';
import ContactUsPage from './pages/ContactUsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import OrdersPage from './pages/OrdersPage'; // For /account/orders specifically
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import CartPage from './pages/CartPage';
import OffersPage from './pages/OffersPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SearchResultsPage from './pages/SearchResultsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CheckoutPage from './pages/CheckoutPage'; // Import CheckoutPage
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/Common/ProtectedRoute';


function App() {
  const { i18n, t } = useTranslation();

  React.useEffect(() => {
    document.body.dir = i18n.dir();
    document.documentElement.lang = i18n.language;
  }, [i18n, i18n.language]);

  // Default title, can be overridden by Helmet in specific pages
  const defaultTitle = t('companyName', 'مفروشات عروبة المنار');

  return (
    <>
      <Helmet titleTemplate={`%s | ${defaultTitle}`} defaultTitle={defaultTitle}>
        <meta name="description" content={t('siteDescription', 'High-quality furniture and decor.')} />
      </Helmet>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/product/:identifier" element={<ProductDetailPage />} /> {/* Add route for product details */}
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/contact-us" element={<ContactUsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/offers" element={<OffersPage />} />

          <Route path="/account/login" element={<LoginPage />} />
          <Route path="/account/register" element={<RegisterPage />} />

          <Route
            path="/account"
            element={<ProtectedRoute><AccountPage /></ProtectedRoute>}
          />
          <Route
            path="/account/orders"
            element={<ProtectedRoute><OrdersPage /></ProtectedRoute>}
          />
          <Route
            path="/checkout"
            element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>}
          />

          <Route path="/account/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/account/reset-password/:token" element={<ResetPasswordPage />} />

          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

          {/* Add more routes as needed, e.g., for product details: /product/:id */}

          <Route path="*" element={<NotFoundPage />} /> {/* Catch-all for 404 */}
        </Routes>
      </Layout>
    </>
  );
}

export default App;
