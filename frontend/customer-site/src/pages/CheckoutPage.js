import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Form, Button, Card, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { createOrder as apiCreateOrder } from '../services/apiService';

const CheckoutPage = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const navigate = useNavigate();
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const { cartItems, cartTotals, clearClientCart, loading: cartLoading, error: cartError } = useCart();

  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    street: '',
    houseNumber: '',
    city: '',
    postalCode: '',
    country: '', // Default or fetched from user profile
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('CashOnDelivery'); // Default payment method
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

  useEffect(() => {
    // Pre-fill shipping from user profile if available (and if user wants to use it)
    if (user && user.addresses && user.addresses.length > 0) {
      // Assuming user model might have an array of addresses, pick the default or first one
      // For now, this is a placeholder as User model doesn't have addresses array yet.
      // setShippingAddress(user.addresses[0]);
    }
    if (!authLoading && !isAuthenticated) {
        navigate('/account/login?redirect=/checkout');
    }
    if (!cartLoading && cartItems.length === 0 && !authLoading) {
        navigate('/cart'); // Redirect to cart if it's empty
    }

  }, [user, isAuthenticated, authLoading, cartItems, cartLoading, navigate]);

  const handleShippingChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setStatus({ loading: false, error: t('checkoutPage.error.emptyCart'), success: null });
      return;
    }
    setStatus({ loading: true, error: null, success: null });

    const orderData = {
      orderItems: cartItems.map(item => ({
        product: item.product._id,
        name_en: item.product.name_en, // Storing names at time of order
        name_ar: item.product.name_ar,
        quantity: item.quantity,
        price: item.product.price,
        image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : '',
      })),
      shippingAddress,
      paymentMethod,
      itemsPrice: cartTotals.subtotal,
      taxPrice: cartTotals.tax, // Assuming tax is calculated in cartTotals
      shippingPrice: cartTotals.shipping, // Assuming shipping is calculated
      totalPrice: cartTotals.total,
    };

    try {
      const response = await apiCreateOrder(orderData, token);
      if (response.data && response.data.success) {
        setStatus({ loading: false, error: null, success: t('checkoutPage.success.orderPlaced', { orderId: response.data.data._id }) });
        await clearClientCart(); // Clear cart from context and backend
        // Redirect to order confirmation page or account/orders
        setTimeout(() => navigate(`/account/orders`), 5000); // Redirect after 5s
      } else {
        setStatus({ loading: false, error: response.data.message || t('checkoutPage.error.orderDefault'), success: null });
      }
    } catch (err) {
      setStatus({ loading: false, error: err.error || err.message || t('checkoutPage.error.orderNetwork'), success: null });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat(currentLang === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
    }).format(price);
  };

  if (authLoading || cartLoading) {
    return <Container className="my-5 text-center"><Spinner animation="border" /></Container>;
  }
  if (cartError) {
     return <Container className="my-5"><Alert variant="danger">{cartError}</Alert></Container>;
  }


  return (
    <Container className="my-5 checkout-page">
      <Helmet>
        <title>{t('pageTitles.checkout')}</title>
      </Helmet>
      <h1 className="mb-4 page-main-title">{t('checkoutPage.title')}</h1>

      {status.success && <Alert variant="success">{status.success}</Alert>}
      {status.error && <Alert variant="danger">{status.error}</Alert>}

      {!status.success && (
        <Form onSubmit={handleSubmitOrder}>
          <Row>
            <Col md={7} className="mb-4">
              <h4>{t('checkoutPage.shipping.title')}</h4>
              <Form.Group className="mb-3" controlId="checkoutAddress">
                <Form.Label>{t('checkoutPage.shipping.address')}</Form.Label>
                <Form.Control type="text" name="address" value={shippingAddress.address} onChange={handleShippingChange} required />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="checkoutStreet">
                    <Form.Label>{t('checkoutPage.shipping.street')}</Form.Label>
                    <Form.Control type="text" name="street" value={shippingAddress.street} onChange={handleShippingChange} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="checkoutHouseNumber">
                    <Form.Label>{t('checkoutPage.shipping.houseNumber')}</Form.Label>
                    <Form.Control type="text" name="houseNumber" value={shippingAddress.houseNumber} onChange={handleShippingChange} required />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="checkoutCity">
                    <Form.Label>{t('checkoutPage.shipping.city')}</Form.Label>
                    <Form.Control type="text" name="city" value={shippingAddress.city} onChange={handleShippingChange} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="checkoutPostalCode">
                    <Form.Label>{t('checkoutPage.shipping.postalCode')}</Form.Label>
                    <Form.Control type="text" name="postalCode" value={shippingAddress.postalCode} onChange={handleShippingChange} required />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3" controlId="checkoutCountry">
                <Form.Label>{t('checkoutPage.shipping.country')}</Form.Label>
                <Form.Control type="text" name="country" value={shippingAddress.country} onChange={handleShippingChange} required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="checkoutPhone">
                <Form.Label>{t('checkoutPage.shipping.phone')}</Form.Label>
                <Form.Control type="tel" name="phone" value={shippingAddress.phone} onChange={handleShippingChange} required />
              </Form.Group>

              <h4 className="mt-4">{t('checkoutPage.payment.title')}</h4>
              <Form.Group className="mb-3">
                <Form.Check
                  type="radio"
                  id="paymentCashOnDelivery"
                  name="paymentMethod"
                  value="CashOnDelivery"
                  label={t('checkoutPage.payment.cashOnDelivery')}
                  checked={paymentMethod === 'CashOnDelivery'}
                  onChange={handlePaymentMethodChange}
                />
                {/* Add other payment methods here, e.g., Credit Card via Stripe Elements */}
                <Form.Check
                  type="radio"
                  id="paymentCreditCard"
                  name="paymentMethod"
                  value="CreditCard"
                  label={t('checkoutPage.payment.creditCard')}
                  checked={paymentMethod === 'CreditCard'}
                  onChange={handlePaymentMethodChange}
                  disabled // Placeholder
                />
              </Form.Group>
            </Col>

            <Col md={5}>
              <h4>{t('checkoutPage.summary.title')}</h4>
              <Card>
                <ListGroup variant="flush">
                  {cartItems.map(item => ( item.product &&
                    <ListGroup.Item key={item.product._id} className="d-flex justify-content-between align-items-center">
                      <span>{currentLang === 'ar' ? item.product.name_ar : item.product.name_en} x {item.quantity}</span>
                      <span>{formatPrice(item.product.price * item.quantity)}</span>
                    </ListGroup.Item>
                  ))}
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>{t('checkoutPage.summary.subtotal')}</span>
                    <strong>{formatPrice(cartTotals.subtotal)}</strong>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>{t('checkoutPage.summary.shipping')}</span>
                    <strong>{cartTotals.shipping > 0 ? formatPrice(cartTotals.shipping) : t('checkoutPage.summary.freeShipping')}</strong>
                  </ListGroup.Item>
                   <ListGroup.Item className="d-flex justify-content-between">
                    <span>{t('checkoutPage.summary.tax')}</span>
                    <strong>{formatPrice(cartTotals.tax)}</strong>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between fw-bold h5">
                    <span>{t('checkoutPage.summary.total')}</span>
                    <span>{formatPrice(cartTotals.total)}</span>
                  </ListGroup.Item>
                </ListGroup>
                <Card.Body>
                  <div className="d-grid">
                    <Button variant="primary" type="submit" size="lg" disabled={status.loading || cartItems.length === 0}>
                      {status.loading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" />{' '}
                          {t('checkoutPage.placingOrder')}
                        </>
                      ) : t('checkoutPage.placeOrderButton')}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>
      )}
    </Container>
  );
};

export default CheckoutPage;
