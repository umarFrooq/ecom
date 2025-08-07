import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/apiService';

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const { token } = useParams(); // Get token from URL
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setStatus({ loading: false, error: t('resetPasswordPage.form.errorNoToken'), success: null });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setStatus({ loading: false, error: t('resetPasswordPage.form.errorPasswordMismatch'), success: null });
      return;
    }
    setStatus({ loading: true, error: null, success: null });
    try {
      const response = await resetPassword(token, { password: formData.password });
      if (response.data && response.data.success) {
        setStatus({ loading: false, error: null, success: t('resetPasswordPage.form.successDefault') });
        // Optionally log the user in and redirect, or just show success and link to login
        // For now, redirect to login page after a short delay
        setTimeout(() => navigate('/account/login'), 3000);
      } else {
        setStatus({ loading: false, error: response.data.message || t('resetPasswordPage.form.errorDefault'), success: null });
      }
    } catch (err) {
      setStatus({ loading: false, error: err.error || err.message || t('resetPasswordPage.form.errorNetwork'), success: null });
    }
  };

  return (
    <Container className="my-5" style={{ maxWidth: '500px' }}>
      <Helmet>
        <title>{t('pageTitles.resetPassword', 'Reset Password')}</title>
      </Helmet>
      <Row className="justify-content-md-center">
        <Col>
          <h2 className="text-center mb-4">{t('resetPasswordPage.title', 'Reset Your Password')}</h2>
          {status.success ? (
            <Alert variant="success">{status.success} {t('resetPasswordPage.redirectingToLogin', 'Redirecting to login...')}</Alert>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="resetFormPassword">
                <Form.Label>{t('resetPasswordPage.form.newPassword', 'New Password')}</Form.Label>
                <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="resetFormConfirmPassword">
                <Form.Label>{t('resetPasswordPage.form.confirmNewPassword', 'Confirm New Password')}</Form.Label>
                <Form.Control type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
              </Form.Group>

              {status.error && <Alert variant="danger">{status.error}</Alert>}

              <div className="d-grid">
                <Button variant="primary" type="submit" disabled={status.loading}>
                  {status.loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      {' '}
                      {t('resetPasswordPage.form.resetting', 'Resetting Password...')}
                    </>
                  ) : (
                    t('resetPasswordPage.form.submitButton', 'Reset Password')
                  )}
                </Button>
              </div>
            </Form>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ResetPasswordPage;
