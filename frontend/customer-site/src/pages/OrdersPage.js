import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, ListGroup, Alert, Spinner, Card, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { getMyOrders } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

const OrdersPage = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const { token, isAuthenticated, loading: authLoading } = useAuth(); // Get token and auth state
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true); // Local loading for orders fetch
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) { // Wait for auth context to initialize
      setLoading(true);
      return;
    }
    if (!isAuthenticated || !token) {
      navigate('/account/login'); // Redirect if not authenticated
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getMyOrders(token); // Use token from context
        if (response.data && response.data.success) {
          setOrders(response.data.data);
        } else {
          setError(response.data.message || t('ordersPage.error.fetchDefault', 'Failed to load orders.'));
        }
      } catch (err) {
        setError(err.error || err.message || t('ordersPage.error.fetchNetwork', 'An error occurred.'));
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [t, token, isAuthenticated, authLoading, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat(currentLang === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR', // Assuming SAR, make this dynamic if needed
    }).format(price);
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <Badge bg="warning">{t('orderStatus.pending', 'Pending')}</Badge>;
      case 'Processing': return <Badge bg="info">{t('orderStatus.processing', 'Processing')}</Badge>;
      case 'Shipped': return <Badge bg="primary">{t('orderStatus.shipped', 'Shipped')}</Badge>;
      case 'Delivered': return <Badge bg="success">{t('orderStatus.delivered', 'Delivered')}</Badge>;
      case 'Cancelled': return <Badge bg="danger">{t('orderStatus.cancelled', 'Cancelled')}</Badge>;
      case 'Failed': return <Badge bg="danger">{t('orderStatus.failed', 'Failed')}</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };


  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" /> <p>{t('ordersPage.loading', 'Loading your orders...')}</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <Link to="/account/login" className="btn btn-primary">{t('loginPage.title')}</Link>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Helmet>
        <title>{t('pageTitles.myOrders', 'طلباتي')}</title>
      </Helmet>
      <h2 className="mb-4">{t('ordersPage.title', 'طلباتي')}</h2>
      {orders.length === 0 ? (
        <Alert variant="info">{t('ordersPage.noOrders', 'ليس لديك أي طلبات حتى الآن.')}</Alert>
      ) : (
        <ListGroup>
          {orders.map((order) => (
            <ListGroup.Item key={order._id} className="mb-3 shadow-sm">
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{t('ordersPage.orderIdLabel', 'Order ID')}:</strong> {order._id} <br/>
                    <strong>{t('ordersPage.dateLabel', 'Date')}:</strong> {new Date(order.createdAt).toLocaleDateString(currentLang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-CA')}
                  </div>
                  <div>{getOrderStatusBadge(order.orderStatus)}</div>
                </Card.Header>
                <Card.Body>
                    <Card.Text>
                        <strong>{t('ordersPage.totalLabel', 'Total')}:</strong> {formatPrice(order.totalPrice)} <br/>
                        <strong>{t('ordersPage.paymentStatusLabel', 'Payment')}:</strong> {order.isPaid ? t('ordersPage.paid', 'Paid') : t('ordersPage.notPaid', 'Not Paid')}
                        {order.isPaid && order.paidAt ? ` (${new Date(order.paidAt).toLocaleDateString(currentLang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-CA')})` : ''}
                    </Card.Text>
                    <h6>{t('ordersPage.itemsLabel', 'Items')}:</h6>
                    <ul>
                        {order.orderItems.map(item => (
                            <li key={item._id}>
                                {currentLang === 'ar' ? item.name_ar : item.name_en} - {item.quantity} x {formatPrice(item.price)}
                            </li>
                        ))}
                    </ul>
                     {/* <Link to={`/account/orders/${order._id}`} className="btn btn-sm btn-outline-primary">
                        {t('ordersPage.viewDetailsButton', 'View Details')}
                    </Link> */}
                </Card.Body>
              </Card>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </Container>
  );
};

export default OrdersPage;
