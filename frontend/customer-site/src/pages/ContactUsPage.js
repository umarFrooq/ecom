import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faMapMarkerAlt, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { submitContactForm } from '../services/apiService';
// import './ContactUsPage.css'; // Optional

const ContactUsPage = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: null });
    try {
      const response = await submitContactForm(formData);
      if (response.data && response.data.success) {
        setStatus({ loading: false, error: null, success: response.data.message || t('contactUsPage.form.successDefault') });
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' }); // Reset form
      } else {
        setStatus({ loading: false, error: response.data.message || t('contactUsPage.form.errorDefault'), success: null });
      }
    } catch (err) {
      setStatus({ loading: false, error: err.message || t('contactUsPage.form.errorNetwork'), success: null });
    }
  };

  return (
    <Container className="my-5 contact-us-page">
      <Helmet>
        <title>{t('pageTitles.contactUs')}</title>
      </Helmet>
      <h1 className="text-center page-main-title mb-5">{t('contactUsPage.title')}</h1>

      <Row>
        <Col md={6} className="mb-4 mb-md-0">
          <h3 className="mb-3">{t('contactUsPage.form.title')}</h3>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="contactFormName">
              <Form.Label>{t('contactUsPage.form.name')}</Form.Label>
              <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="contactFormEmail">
                  <Form.Label>{t('contactUsPage.form.email')}</Form.Label>
                  <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="contactFormPhone">
                  <Form.Label>{t('contactUsPage.form.phone')} <span className="text-muted">({t('common.optional')})</span></Form.Label>
                  <Form.Control type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3" controlId="contactFormSubject">
              <Form.Label>{t('contactUsPage.form.subject')}</Form.Label>
              <Form.Control type="text" name="subject" value={formData.subject} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="contactFormMessage">
              <Form.Label>{t('contactUsPage.form.message')}</Form.Label>
              <Form.Control as="textarea" name="message" value={formData.message} onChange={handleChange} rows={5} required />
            </Form.Group>

            {status.success && <Alert variant="success">{status.success}</Alert>}
            {status.error && <Alert variant="danger">{status.error}</Alert>}

            <Button variant="primary" type="submit" disabled={status.loading}>
              {status.loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  {' '}
                  {t('contactUsPage.form.sending')}
                </>
              ) : (
                t('contactUsPage.form.submitButton')
              )}
            </Button>
          </Form>
        </Col>

        <Col md={6}>
          <h3 className="mb-3">{t('contactUsPage.info.title')}</h3>
          <p>{t('contactUsPage.info.intro')}</p>
          <ul className="list-unstyled contact-info-list">
            <li className="mb-3">
              <FontAwesomeIcon icon={faPhone} className="me-2 text-primary" />
              <strong>{t('contactUsPage.info.phoneLabel')}:</strong> <a href="tel:+966558494648" className="text-decoration-none text-dark">+966 558494648</a>
            </li>
            <li className="mb-3">
              <FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" />
              <strong>{t('contactUsPage.info.emailLabel')}:</strong> <a href="mailto:info@example.com" className="text-decoration-none text-dark">info@mafrushat-almanar.com</a> {/* Replace with actual email */}
            </li>
            <li className="mb-3">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-primary" />
              <strong>{t('contactUsPage.info.addressLabel')}:</strong>
              <p className="mt-1 mb-0">{t('footer.address')}</p>
            </li>
          </ul>
          <h4 className="mt-4 mb-3">{t('contactUsPage.info.hoursTitle')}</h4>
          <p>{t('contactUsPage.info.hoursText')}</p>
          <p>{t('contactUsPage.info.fridayHoursText')}</p>

          {/* Optional: Google Maps Embed */}
          <div className="mt-4">
             <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3624.234584206015!2d46.727600915000005!3d24.61580438411934!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e2f05a808a49e9f%3A0x8c6b8b1b8b1b8b1b!2sManfouha%2C%20Riyadh%20Saudi%20Arabia!5e0!3m2!1sen!2sus!4v1627700000000!5m2!1sen!2sus"
                width="100%"
                height="300"
                style={{ border:0 }}
                allowFullScreen=""
                loading="lazy"
                title={t('contactUsPage.info.mapTitle')}>
            </iframe>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ContactUsPage;
