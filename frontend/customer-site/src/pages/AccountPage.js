import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Nav, Tab, Alert, Spinner, Button, Form } from 'react-bootstrap'; // Added Form
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
// import { getMe, updateUserDetails } from '../services/apiService'; // Will use context
import { useAuth } from '../contexts/AuthContext';

// Placeholder components for different account sections
const ProfileDetails = ({ t }) => { // Removed user, onUpdate props, will use context
    const { user, updateUser, loading: authLoading, error: authError, setError: setAuthError } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
    });
    const [status, setStatus] = useState({loading: false, error: null, success: null}); // Local status for this form

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                username: user.username || '',
                email: user.email || '',
            });
        }
    }, [user]);

    // Clear auth error from context when component mounts or user changes, if it's relevant to this form
    useEffect(() => {
        setAuthError(null);
    }, [setAuthError, user]);


    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({loading: true, error: null, success: null});
        try {
            await updateUser(formData); // updateUser from context
            setStatus({loading: false, error: null, success: t('accountPage.profile.updateSuccess')});
        } catch (err) {
            // AuthContext's updateUser sets its own error, but we might want local form error too
            setStatus({loading: false, error: err.error || err.message || t('accountPage.profile.updateErrorNetwork'), success: null});
        }
    };

    if (!user) return <Spinner animation="border" />; // Or some other loading/placeholder

    return (
        <Form onSubmit={handleSubmit}> {/* Changed from <form> to <Form> */}
            <h4>{t('accountPage.profile.title', 'Profile Details')}</h4>
            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3" controlId="profileFirstName"> {/* Changed to Form.Group */}
                        <Form.Label>{t('accountPage.profile.firstName', 'First Name')}</Form.Label>
                        <Form.Control type="text" name="firstName" value={formData.firstName} onChange={handleChange} />
                    </Form.Group>
                </Col>
                <Col md={6}>
                     <Form.Group className="mb-3" controlId="profileLastName">
                        <Form.Label>{t('accountPage.profile.lastName', 'Last Name')}</Form.Label>
                        <Form.Control type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
                    </Form.Group>
                </Col>
            </Row>
            <Form.Group className="mb-3" controlId="profileUsername">
                <Form.Label>{t('accountPage.profile.username', 'Username')}</Form.Label>
                <Form.Control type="text" name="username" value={formData.username} onChange={handleChange} required/>
            </Form.Group>
            <Form.Group className="mb-3" controlId="profileEmail">
                <Form.Label>{t('accountPage.profile.email', 'Email')}</Form.Label>
                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required/>
            </Form.Group>
            {status.success && <Alert variant="success">{status.success}</Alert>}
            {/* Display error from local form status OR from AuthContext if relevant */}
            {(status.error || authError) && <Alert variant="danger">{status.error || authError}</Alert>}
            <Button type="submit" variant="primary" disabled={authLoading || status.loading}>
                { (authLoading || status.loading) ? t('accountPage.profile.saving', 'Saving...') : t('accountPage.profile.saveButton', 'Save Changes')}
            </Button>
        </Form>
    );
};

const OrderHistory = () => {
    const { t } = useTranslation();
    // TODO: Fetch and display order history using AuthContext token
    return <div><h4>{t('accountPage.orders.title', 'Order History')}</h4><p>{t('accountPage.orders.placeholder', 'Your past orders will be listed here.')}</p> <Link to="/account/orders">{t('accountPage.orders.viewAllLink', 'View All Orders')}</Link></div>;
};
const ManageAddresses = () => {
    const { t } = useTranslation();
    // TODO: Implement address management
    return <div><h4>{t('accountPage.addresses.title', 'Manage Addresses')}</h4><p>{t('accountPage.addresses.placeholder', 'Your saved addresses will be shown here.')}</p></div>;
};


const AccountPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation(); // To manage active tab based on hash
  const { user, logout, loading: authLoading, error: authError, isAuthenticated, refreshUser } = useAuth();

  // Refresh user data when component mounts, in case it was updated elsewhere
  useEffect(() => {
      if (isAuthenticated) {
          refreshUser();
      }
  }, [isAuthenticated, refreshUser]);

  // If not authenticated after loading, redirect to login
  // This check might be redundant if ProtectedRoute is used, but good as a safeguard
  // Moved this hook before any early returns to satisfy rules-of-hooks
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/account/login', { state: { from: location } });
    }
  }, [authLoading, isAuthenticated, navigate, location]);

  const handleLogout = async () => {
    await logout();
    navigate('/'); // Redirect to homepage
  };

  // const handleUserUpdate = (updatedUser) => { // No longer needed, ProfileDetails uses context directly
  //   setCurrentUser(updatedUser);
  // };

  // This loading is for the initial check by AuthProvider, or a direct fetch if implemented here
  if (authLoading && !user) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">{t('loading', 'Loading...')}</span>
        </Spinner>
      </Container>
    );
  }

  // Removed redundant useEffect hook. The same logic is present on lines 101-105.

  if (!isAuthenticated || !user) { // Fallback for non-authenticated state
    // Should be handled by redirect in useEffect or ProtectedRoute
    return (
      <Container className="my-5 text-center">
         <Spinner animation="border" /><p>{t('accountPage.redirectingToLogin', 'Redirecting to login...')}</p>
      </Container>
    );
  }

  // Display AuthContext error if any (e.g. failed refreshUser)
   if (authError) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{t('error', 'Error')}: {authError}</Alert>
        <Button onClick={handleLogout}>{t('accountPage.nav.logout', 'Logout')}</Button>
      </Container>
    );
  }


  return (
    <Container className="my-5 account-page">
      <Helmet>
        <title>{t('pageTitles.myAccount', 'حسابي')}</title>
      </Helmet>
      <Row>
        <Col md={3}>
          <h4 className="mb-3">{t('accountPage.welcome', 'Welcome')}, {user?.firstName || user?.username}!</h4>
          <Nav variant="pills" className="flex-column account-nav">
            <Nav.Item>
              <Nav.Link eventKey="profile" as={Link} to="#profile" active={location.hash === '#profile' || !location.hash}>
                {t('accountPage.nav.profile', 'Profile')}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="orders" as={Link} to="#orders" active={location.hash === '#orders'}>
                {t('accountPage.nav.orders', 'My Orders')}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="addresses" as={Link} to="#addresses" active={location.hash === '#addresses'}>
                {t('accountPage.nav.addresses', 'Addresses')}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link onClick={handleLogout}>
                    {t('accountPage.nav.logout', 'Logout')}
                </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col md={9}>
          <Tab.Container id="account-tabs" defaultActiveKey={location.hash.substring(1) || 'profile'}>
            <Tab.Content>
              <Tab.Pane eventKey="profile">
                <ProfileDetails user={user} t={t} />
              </Tab.Pane>
              <Tab.Pane eventKey="orders">
                <OrderHistory />
              </Tab.Pane>
              <Tab.Pane eventKey="addresses">
                <ManageAddresses />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Col>
      </Row>
    </Container>
  );
};

export default AccountPage;
