import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/apiService';

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: null });
    try {
      const response = await forgotPassword({ email });
      if (response.data && response.data.success) {
        setStatus({ loading: false, error: null, success: response.data.message || t('forgotPasswordPage.form.successDefault') });
      } else {
        // Even if backend doesn't find user, it might return success to not reveal user existence.
        // So, if message is present, show it. Otherwise, a generic success.
        setStatus({ loading: false, error: response.data.message && !response.data.success ? response.data.message : null, success: response.data.message || t('forgotPasswordPage.form.successDefault') });
      }
    } catch (err) {
      // err might be an object from axios containing err.error or err.message
      // or just a string if Promise.reject was called with a string
      const errorMessage = typeof err === 'string' ? err : (err.error || err.message || t('forgotPasswordPage.form.errorNetwork'));
      setStatus({ loading: false, error: errorMessage, success: null });
    }
  };

  return (
    <Container className="my-5" style={{ maxWidth: '500px' }}>
      <Helmet>
        <title>{t('pageTitles.forgotPassword', 'Forgot Password')}</title>
      </Helmet>
      <Row className="justify-content-md-center">
        <Col>
          <h2 className="text-center mb-4">{t('forgotPasswordPage.title', 'Forgot Your Password?')}</h2>
          <p className="text-center mb-4">
            {t('forgotPasswordPage.instruction', 'Enter your email address below and we will send you a link to reset your password.')}
          </p>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="forgotPasswordEmail">
              <Form.Label>{t('forgotPasswordPage.form.email', 'Email Address')}</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            {status.success && <Alert variant="success">{status.success}</Alert>}
            {status.error && <Alert variant="danger">{status.error}</Alert>}

            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={status.loading}>
                {status.loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    {' '}
                    {t('forgotPasswordPage.form.sending', 'Sending Reset Link...')}
                  </>
                ) : (
                  t('forgotPasswordPage.form.submitButton', 'Send Reset Link')
                )}
              </Button>
            </div>
          </Form>
          <div className="mt-3 text-center">
            <Link to="/account/login">{t('forgotPasswordPage.backToLoginLink', 'Back to Login')}</Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPasswordPage;
