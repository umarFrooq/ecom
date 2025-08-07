import React from 'react';
// import React, { useState } from 'react'; // Added useState
import { useState, useEffect } from 'react'; // Added useEffect
import { Navbar, Nav, Container, Button, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUser, faShoppingCart, faBars, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'; // Added faSignOutAlt
import { useTranslation } from 'react-i18next';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext'; // Import useCart
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher'; // Import LanguageSwitcher
import './Navbar.css';

// import logo from '../../assets/images/logo.png';

const GlobalNavbar = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, logout } = useAuth();
  const { cartTotals } = useCart(); // Use CartContext for cart item count

  const cartItemsCount = cartTotals.itemCount; // Get item count from cartTotals

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(''); // Clear search input after submission
    }
  };

  return (
   
    <Navbar expand="lg" className={`global-navbar fixed-top ${currentLang === 'ar' ? 'rtl' : 'ltr'}`} dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
      <Container fluid>
        <LinkContainer to="/">
          <Navbar.Brand href="/" className="navbar-brand-custom">
            <img src="https://alfaorigin.s3.eu-north-1.amazonaws.com/products/1752249595916-logoo.png" alt={t('nav.logoAlt', 'Company Logo')} height="40" />
            {/* {t('companyName', 'مفروشات عروبة المنار')} Fallback to Arabic name */}
          </Navbar.Brand>
        </LinkContainer>

        <Navbar.Toggle aria-controls="global-navbar-nav">
          <FontAwesomeIcon icon={faBars} />
        </Navbar.Toggle>

        <Navbar.Collapse id="global-navbar-nav">
          <Nav className="me-auto main-nav-links">
            <LinkContainer to="/">
              <Nav.Link>{t('nav.home', 'الرئيسية')}</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/shop">
              <Nav.Link>{t('nav.shop', 'المتجــــــر')}</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/projects">
              <Nav.Link>{t('nav.projects', 'مشاريعنا')}</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/about-us">
              <Nav.Link>{t('nav.aboutUs', 'مـــن نـــحـــن؟')}</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/contact-us">
              <Nav.Link>{t('nav.contactUs', 'تواصل معنا')}</Nav.Link>
            </LinkContainer>
          </Nav>

          <Nav className="align-items-center secondary-nav-links">
            <Form onSubmit={handleSearchSubmit} className="d-flex me-lg-3 mb-2 mb-lg-0 search-form-custom">
              <InputGroup>
                <Form.Control
                  type="search"
                  placeholder={t('nav.searchPlaceholder', 'ابحث عن منتجات...')}
                  className="search-input"
                  aria-label="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="outline-primary" type="submit" className="search-button">
                  <FontAwesomeIcon icon={faSearch} />
                </Button>
              </InputGroup>
            </Form>

            {isAuthenticated && user ? (
              <Dropdown as={Nav.Item} className="me-lg-2 mb-2 mb-lg-0 user-dropdown" align={currentLang === 'ar' ? 'start' : 'end'}>
                <Dropdown.Toggle as={Nav.Link} className="icon-link">
                  <FontAwesomeIcon icon={faUser} size="lg" />
                  <span className="d-lg-none ms-2">{user.firstName || user.username}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Header>{t('nav.welcome', 'Welcome')}, {user.firstName || user.username}!</Dropdown.Header>
                  <LinkContainer to="/account">
                    <Dropdown.Item>{t('nav.myAccount', 'حسابي')}</Dropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/account/orders">
                    <Dropdown.Item>{t('nav.myOrders', 'طلباتي')}</Dropdown.Item>
                  </LinkContainer>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={async () => { await logout(); navigate('/'); }}>
                    <FontAwesomeIcon icon={faSignOutAlt} className={currentLang === 'ar' ? 'ms-2' : 'me-2'} />
                    {t('nav.logout', 'تسجيل الخروج')}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Dropdown as={Nav.Item} className="me-lg-2 mb-2 mb-lg-0 user-dropdown" align={currentLang === 'ar' ? 'start' : 'end'}>
                <Dropdown.Toggle as={Nav.Link} className="icon-link">
                  <FontAwesomeIcon icon={faUser} size="lg" />
                  <span className="d-lg-none ms-2">{t('nav.account', 'حسابي')}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <LinkContainer to="/account/login">
                    <Dropdown.Item>{t('nav.login', 'تسجيل الدخول')}</Dropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/account/register">
                    <Dropdown.Item>{t('nav.register', 'إنشاء حساب')}</Dropdown.Item>
                  </LinkContainer>
                   <Dropdown.Divider />
                   <LinkContainer to="/privacy-policy">
                    <Dropdown.Item>{t('nav.privacyPolicy', 'سياسة الخصوصية')}</Dropdown.Item>
                  </LinkContainer>
                </Dropdown.Menu>
              </Dropdown>
            )}

            <LinkContainer to="/cart">
              <Nav.Link className="icon-link cart-link me-lg-2 mb-2 mb-lg-0">
                <FontAwesomeIcon icon={faShoppingCart} size="lg" />
                {cartItemsCount > 0 && <span className="cart-badge">{cartItemsCount}</span>}
                <span className="d-lg-none ms-2">{t('nav.cart', 'سلة المشتريات')}</span>
              </Nav.Link>
            </LinkContainer>

            {/* LanguageSwitcher can be placed here or elsewhere */}
            <LanguageSwitcher />
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default GlobalNavbar;
