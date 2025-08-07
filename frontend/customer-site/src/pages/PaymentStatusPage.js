import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Container, Alert, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

// A simple utility to parse query strings
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const PaymentStatusPage = () => {
  const { t } = useTranslation();
  const query = useQuery();
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const paymentStatus = query.get('status');
    const orderId = query.get('orderId');

    if (paymentStatus === 'success') {
      setStatus('success');
      setMessage(t('paymentStatusPage.success', { orderId }));
    } else if (paymentStatus === 'failed') {
      setStatus('danger');
      setMessage(t('paymentStatusPage.failed', { reason: query.get('reason') || t('paymentStatusPage.defaultReason') }));
    } else {
      setStatus('warning');
      setMessage(t('paymentStatusPage.unknown'));
    }
  }, [query, t]);

  return (
    <Container className="my-5 text-center">
      <Helmet>
        <title>{t('pageTitles.paymentStatus')}</title>
      </Helmet>
      {status && (
        <Alert variant={status}>
          <Alert.Heading>
            {status === 'success' ? t('paymentStatusPage.successTitle') : t('paymentStatusPage.failureTitle')}
          </Alert.Heading>
          <p>{message}</p>
          <hr />
          <div className="d-flex justify-content-center">
            <Button as={Link} to="/account/orders" variant={`outline-${status}`}>
              {t('paymentStatusPage.viewOrders')}
            </Button>
          </div>
        </Alert>
      )}
    </Container>
  );
};

export default PaymentStatusPage;
