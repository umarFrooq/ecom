import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
// import './NotFoundPage.css'; // Optional

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <Container className="my-5 text-center not-found-page">
      <Helmet>
        <title>{t('pageTitles.notFound', 'Page Not Found')}</title>
      </Helmet>
      <Row className="justify-content-center">
        <Col md={8}>
          <h1 className="display-1 text-primary">{t('notFoundPage.errorCode', '404')}</h1>
          <h2 className="mb-4">{t('notFoundPage.title', 'Oops! Page Not Found.')}</h2>
          <p className="lead mb-4">
            {t('notFoundPage.message', "We can't seem to find the page you're looking for. It might have been removed, had its name changed, or is temporarily unavailable.")}
          </p>
          <Button as={Link} to="/" variant="primary" size="lg">
            {t('notFoundPage.goHomeButton', 'Go to Homepage')}
          </Button>
          {/* You can add an image or illustration here */}
          {/* <img src="/path/to/404-image.svg" alt="Page not found" className="mt-4" style={{maxWidth: '300px'}} /> */}
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage;
