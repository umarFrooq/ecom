import React from 'react';
import { Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt, faBoxOpen, faTags, faShoppingCart, faUsers,
  faChartLine, faCog, faSignOutAlt, faFileContract, faHome, faEnvelope // Added icons for projects and homepage
} from '@fortawesome/free-solid-svg-icons';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import { useAdminAuth } from '../../contexts/AdminAuthContext'; // Import useAdminAuth
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirect on logout
import './Sidebar.css';

const Sidebar = () => {
  const { t, i18n } = useTranslation();
  const { adminUser, logout } = useAdminAuth(); // Get user and logout function
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login'); // Redirect to login page after logout
  };

  if (!adminUser) { // Don't render sidebar if no admin user (e.g. on login page)
    return null;
  }

  return (
    <div className={`sidebar ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="sidebar-header">
        <h3>{t('adminPanel.title', 'Admin Panel')}</h3>
        <small className="text-light">{t('adminPanel.welcomeUser', 'Welcome, {{username}}', { username: adminUser.username })}</small>
      </div>
      <Nav className="flex-column sidebar-nav">
        <LinkContainer to="/admin/dashboard">
          <Nav.Link>
            <FontAwesomeIcon icon={faTachometerAlt} className="nav-icon" />
            {t('adminPanel.nav.dashboard', 'Dashboard')}
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/admin/products">
          <Nav.Link>
            <FontAwesomeIcon icon={faBoxOpen} className="nav-icon" />
            {t('adminPanel.nav.products', 'Products')}
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/admin/categories">
          <Nav.Link>
            <FontAwesomeIcon icon={faTags} className="nav-icon" />
            {t('adminPanel.nav.categories', 'Categories')}
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/admin/orders">
          <Nav.Link>
            <FontAwesomeIcon icon={faShoppingCart} className="nav-icon" />
            {t('adminPanel.nav.orders', 'Orders')}
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/admin/users">
          <Nav.Link>
            <FontAwesomeIcon icon={faUsers} className="nav-icon" />
            {t('adminPanel.nav.users', 'Users')}
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/admin/contact-messages">
          <Nav.Link>
            <FontAwesomeIcon icon={faEnvelope} className="nav-icon" />
            {t('adminPanel.nav.contactMessages', 'Contact Messages')}
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/admin/projects-content">
          <Nav.Link>
            <FontAwesomeIcon icon={faFileContract} className="nav-icon" />
            {t('adminPanel.nav.projectsContent', 'Projects Content')}
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/admin/homepage-content">
          <Nav.Link>
            <FontAwesomeIcon icon={faHome} className="nav-icon" />
            {t('adminPanel.nav.homepageContent', 'Homepage Content')}
          </Nav.Link>
        </LinkContainer>
        <LinkContainer to="/admin/analytics">
          <Nav.Link>
            <FontAwesomeIcon icon={faChartLine} className="nav-icon" />
            {t('adminPanel.nav.analytics', 'Analytics')}
          </Nav.Link>
        </LinkContainer>
        <hr className="sidebar-divider" />
        <LinkContainer to="/admin/settings">
          <Nav.Link>
            <FontAwesomeIcon icon={faCog} className="nav-icon" />
            {t('adminPanel.nav.settings', 'Settings')}
          </Nav.Link>
        </LinkContainer>
        <Nav.Link onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} className="nav-icon" />
          {t('adminPanel.nav.logout', 'Logout')}
        </Nav.Link>
      </Nav>
      <div className="sidebar-footer">
        <LanguageSwitcher />
      </div>
    </div>
  );
};

export default Sidebar;
