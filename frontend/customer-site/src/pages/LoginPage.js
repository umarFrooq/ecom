import React, { useState ,useEffect} from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
// import { loginUser } from '../services/apiService'; // Will use context's login
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading: authLoading, error: authError, setError: setAuthError } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  // const [status, setStatus] = useState({ loading: false, error: null }); // Use context's loading/error

  // Clear auth error on component mount or when location changes (e.g. navigating away and back)
  useEffect(() => {
    setAuthError(null);
  }, [setAuthError, location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // setStatus({ loading: true, error: null }); // Context handles loading/error
    try {
      await login(formData);
      // navigate('/'); // Redirect to home page
      const from = location.state?.from?.pathname || '/'; // Redirect to previous page or home
      navigate(from, { replace: true });
    } catch (err) {
      // Error is set in AuthContext, component will re-render and display it
      console.error("Login page submit error:", err);
    }
  };

  return (
    <Container className="my-5 login-page" style={{ maxWidth: '500px' }}>
      <Helmet>
        <title>{t('pageTitles.login', 'تسجيل الدخول')}</title>
      </Helmet>
      <Row className="justify-content-md-center">
        <Col md={12}>
          <h2 className="text-center mb-4">{t('loginPage.title', 'تسجيل الدخول')}</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="loginFormEmail">
              <Form.Label>{t('loginPage.form.email', 'البريد الإلكتروني أو اسم المستخدم')}</Form.Label>
              <Form.Control
                type="text" // Can be email or username
                name="email" // Backend authController's loginAdmin expects 'email' field for both username/email
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="loginFormPassword">
              <Form.Label>{t('loginPage.form.password', 'كلمة المرور')}</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Form.Group>

            {authError && <Alert variant="danger">{authError}</Alert>}

            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={authLoading}>
                {authLoading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    {' '}
                    {t('loginPage.form.loggingIn', 'جارِ تسجيل الدخول...')}
                  </>
                ) : (
                  t('loginPage.form.submitButton', 'تسجيل الدخول')
                )}
              </Button>
            </div>
          </Form>
          <div className="mt-3 text-center">
            <Link to="/account/forgot-password">{t('loginPage.forgotPasswordLink', 'نسيت كلمة المرور؟')}</Link>
          </div>
          <hr />
          <div className="mt-3 text-center">
            {t('loginPage.noAccount', 'ليس لديك حساب؟')}{' '}
            <Link to="/account/register">{t('loginPage.registerLink', 'إنشاء حساب جديد')}</Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
