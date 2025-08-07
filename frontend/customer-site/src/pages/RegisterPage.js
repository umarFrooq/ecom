import React, { useState,useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
// import { registerUser } from '../services/apiService'; // Will use context's register
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loading: authLoading, error: authError, setError: setAuthError } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  // const [status, setStatus] = useState({ loading: false, error: null }); // Use context error/loading

  // Clear auth error on component mount or when location changes
  useEffect(() => {
    setAuthError(null);
  }, [setAuthError, location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setAuthError(t('registerPage.form.errorPasswordMismatch'));
      // setStatus({ loading: false, error: t('registerPage.form.errorPasswordMismatch') });
      return;
    }
    // setStatus({ loading: true, error: null }); // Context handles this
    try {
      const { confirmPassword, ...apiData } = formData;
      await register(apiData);
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      // Error is set in AuthContext
      console.error("Register page submit error:", err);
    }
  };

  return (
    <Container className="my-5 register-page" style={{ maxWidth: '600px' }}>
      <Helmet>
        <title>{t('pageTitles.register', 'إنشاء حساب جديد')}</title>
      </Helmet>
      <Row className="justify-content-md-center">
        <Col md={12}>
          <h2 className="text-center mb-4">{t('registerPage.title', 'إنشاء حساب جديد')}</h2>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="registerFormFirstName">
                  <Form.Label>{t('registerPage.form.firstName', 'الاسم الأول')}</Form.Label>
                  <Form.Control type="text" name="firstName" value={formData.firstName} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="registerFormLastName">
                  <Form.Label>{t('registerPage.form.lastName', 'اسم العائلة')}</Form.Label>
                  <Form.Control type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="registerFormUsername">
              <Form.Label>{t('registerPage.form.username', 'اسم المستخدم')}</Form.Label>
              <Form.Control type="text" name="username" value={formData.username} onChange={handleChange} required />
            </Form.Group>

            <Form.Group className="mb-3" controlId="registerFormEmail">
              <Form.Label>{t('registerPage.form.email', 'البريد الإلكتروني')}</Form.Label>
              <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="registerFormPassword">
                  <Form.Label>{t('registerPage.form.password', 'كلمة المرور')}</Form.Label>
                  <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="registerFormConfirmPassword">
                  <Form.Label>{t('registerPage.form.confirmPassword', 'تأكيد كلمة المرور')}</Form.Label>
                  <Form.Control type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
                </Form.Group>
              </Col>
            </Row>

            {authError && <Alert variant="danger">{authError}</Alert>}

            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={authLoading}>
                {authLoading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    {' '}
                    {t('registerPage.form.registering', 'جارِ التسجيل...')}
                  </>
                ) : (
                  t('registerPage.form.submitButton', 'إنشاء الحساب')
                )}
              </Button>
            </div>
          </Form>
          <hr/>
          <div className="mt-3 text-center">
            {t('registerPage.alreadyHaveAccount', 'لديك حساب بالفعل؟')}{' '}
            <Link to="/account/login">{t('registerPage.loginLink', 'تسجيل الدخول')}</Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage;
