import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Card, Spinner, Alert, Button, ListGroup, Badge, Form } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAdminOrderById, updateAdminOrderStatus, markOrderAsDelivered } from '../../services/adminApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPrint, faTruck } from '@fortawesome/free-solid-svg-icons';

const OrderDetailPage = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdateError, setStatusUpdateError] = useState(null);


  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminOrderById(orderId);
      if (response.data && response.data.success) {
        setOrder(response.data.data);
      } else {
        setError(response.data.message || t('admin.orders.detail.errorFetchDefault'));
      }
    } catch (err) {
      setError(err.message || err.error || t('admin.orders.detail.errorFetchNetwork'));
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleUpdateStatus = async (newStatus) => {
    if (!newStatus || newStatus === order.orderStatus) return;
    if (window.confirm(t('admin.orders.detail.confirmUpdateStatus', { status: newStatus }))) {
        setStatusUpdateError(null);
        try {
            await updateAdminOrderStatus(orderId, { orderStatus: newStatus });
            fetchOrderDetails(); // Refresh order details
        } catch (updError) {
            setStatusUpdateError(updError.message || t('admin.orders.detail.errorUpdateStatus'));
        }
    }
  };

  const handleMarkDelivered = async () => {
     if (window.confirm(t('admin.orders.detail.confirmMarkDelivered'))) {
        setStatusUpdateError(null);
        try {
            await markOrderAsDelivered(orderId);
            fetchOrderDetails(); // Refresh
        } catch (delivError) {
            setStatusUpdateError(delivError.message || t('admin.orders.detail.errorMarkDelivered'));
        }
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat(currentLang === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
    }).format(price);
  };

  const getOrderStatusBadge = (status) => {
    // Same as in OrderListPage, could be a shared utility
    switch (status) {
      case 'Pending': return <Badge bg="warning" text="dark">{t('orderStatus.pending', 'Pending')}</Badge>;
      case 'Processing': return <Badge bg="info">{t('orderStatus.processing', 'Processing')}</Badge>;
      case 'Shipped': return <Badge bg="primary">{t('orderStatus.shipped', 'Shipped')}</Badge>;
      case 'Delivered': return <Badge bg="success">{t('orderStatus.delivered', 'Delivered')}</Badge>;
      case 'Cancelled': return <Badge bg="danger">{t('orderStatus.cancelled', 'Cancelled')}</Badge>;
      case 'Failed': return <Badge bg="secondary">{t('orderStatus.failed', 'Failed')}</Badge>;
      default: return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };

  if (loading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }
  if (error) {
    return <Container className="mt-3"><Alert variant="danger">{error}</Alert></Container>;
  }
  if (!order) {
    return <Container className="mt-3"><Alert variant="warning">{t('admin.orders.detail.notFound')}</Alert></Container>;
  }

  const customerName = order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.username : t('admin.orders.detail.guestUser');

  return (
    <>
      <Helmet>
        <title>{t('admin.orders.detail.pageTitle', { orderId: order._id })} | {t('adminPanel.title')}</title>
      </Helmet>
      <Container fluid className="p-4">
        <Row className="align-items-center mb-3">
          <Col xs="auto">
            <Button variant="outline-secondary" onClick={() => navigate(-1)} title={t('admin.common.backButton')}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </Button>
          </Col>
          <Col>
            <h2 className="admin-page-title mb-0">{t('admin.orders.detail.title', { orderId: order._id })}</h2>
          </Col>
          <Col xs="auto">
            <Button variant="outline-info" onClick={() => window.print()} title={t('admin.common.printButton')}>
                <FontAwesomeIcon icon={faPrint} /> {t('admin.common.print')}
            </Button>
          </Col>
        </Row>

        {statusUpdateError && <Alert variant="danger" onClose={() => setStatusUpdateError(null)} dismissible>{statusUpdateError}</Alert>}

        <Row>
            {/* Order Summary & Actions */}
            <Col lg={4} className="mb-4">
                <Card className="shadow-sm">
                    <Card.Header as="h5">{t('admin.orders.detail.summaryTitle')}</Card.Header>
                    <Card.Body>
                        <p><strong>{t('admin.orders.detail.orderIdLabel')}:</strong> {order._id}</p>
                        <p><strong>{t('admin.orders.detail.datePlacedLabel')}:</strong> {new Date(order.createdAt).toLocaleString(currentLang === 'ar' ? 'ar-EG-u-nu-latn' : undefined)}</p>
                        <p><strong>{t('admin.orders.detail.customerLabel')}:</strong> {customerName} ({order.user?.email})</p>
                        <p><strong>{t('admin.orders.detail.totalAmountLabel')}:</strong> <span className="fw-bold fs-5">{formatPrice(order.totalPrice)}</span></p>
                        <p><strong>{t('admin.orders.detail.paymentMethodLabel')}:</strong> {order.paymentMethod}</p>
                        <p><strong>{t('admin.orders.detail.paymentStatusLabel')}:</strong> {order.isPaid ?
                            <Badge bg="success">{t('admin.orders.detail.paidOn', { date: new Date(order.paidAt).toLocaleDateString()})}</Badge> :
                            <Badge bg="warning" text="dark">{t('admin.orders.detail.notPaid')}</Badge>}
                        </p>
                        <p><strong>{t('admin.orders.detail.deliveryStatusLabel')}:</strong> {order.isDelivered ?
                            <Badge bg="success">{t('admin.orders.detail.deliveredOn', { date: new Date(order.deliveredAt).toLocaleDateString()})}</Badge> :
                            <Badge bg="info">{t('admin.orders.detail.notDelivered')}</Badge>}
                        </p>
                         <p><strong>{t('admin.orders.detail.currentStatusLabel')}:</strong> {getOrderStatusBadge(order.orderStatus)}</p>
                    </Card.Body>
                </Card>
                 <Card className="shadow-sm mt-3">
                    <Card.Header as="h5">{t('admin.orders.detail.actionsTitle')}</Card.Header>
                    <Card.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>{t('admin.orders.detail.changeStatusLabel')}</Form.Label>
                            <Form.Select
                                value={order.orderStatus}
                                onChange={(e) => handleUpdateStatus(e.target.value)}
                                disabled={order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled' || order.orderStatus === 'Failed'}
                            >
                                {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Failed'].map(s => (
                                    <option key={s} value={s} disabled={s === order.orderStatus || ((order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled' || order.orderStatus === 'Failed') && s !== order.orderStatus) }>
                                        {t(`orderStatus.${s.toLowerCase()}`, s)}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        {!order.isDelivered && order.isPaid && order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Failed' && (
                            <Button
                                variant="success"
                                className="w-100"
                                onClick={handleMarkDelivered}
                            >
                                <FontAwesomeIcon icon={faTruck} className="me-2"/>{t('admin.orders.detail.markDeliveredButton')}
                            </Button>
                        )}
                        {/* TODO: Add "Refund Order" button if applicable and backend supports */}
                    </Card.Body>
                 </Card>
            </Col>

            {/* Shipping & Items */}
            <Col lg={8}>
                <Card className="shadow-sm mb-4">
                    <Card.Header as="h5">{t('admin.orders.detail.shippingInfoTitle')}</Card.Header>
                    <Card.Body>
                        <p><strong>{t('admin.orders.detail.shippingAddress.address')}:</strong> {order.shippingAddress.address}</p>
                        <p><strong>{t('admin.orders.detail.shippingAddress.city')}:</strong> {order.shippingAddress.city}</p>
                        <p><strong>{t('admin.orders.detail.shippingAddress.postalCode')}:</strong> {order.shippingAddress.postalCode}</p>
                        <p><strong>{t('admin.orders.detail.shippingAddress.country')}:</strong> {order.shippingAddress.country}</p>
                        <p><strong>{t('admin.orders.detail.shippingAddress.phone')}:</strong> {order.shippingAddress.phone || 'N/A'}</p>
                    </Card.Body>
                </Card>

                <Card className="shadow-sm">
                    <Card.Header as="h5">{t('admin.orders.detail.itemsTitle')}</Card.Header>
                    <ListGroup variant="flush">
                        {order.orderItems.map((item, index) => (
                            <ListGroup.Item key={item._id || index}>
                                <Row className="align-items-center">
                                    <Col xs="auto">
                                        <img src={item.image || 'https://via.placeholder.com/60'} alt={currentLang === 'ar' ? item.name_ar : item.name_en} style={{width: '60px', height: '60px', objectFit: 'cover'}}/>
                                    </Col>
                                    <Col>
                                        <Link to={`/admin/products/edit/${item.product}`}>{currentLang === 'ar' ? item.name_ar : item.name_en}</Link>
                                        <br/>
                                        <small className="text-muted">
                                            {formatPrice(item.price)} x {item.quantity} = {formatPrice(item.price * item.quantity)}
                                        </small>
                                        {item.product?.sku && <small className="d-block text-muted">SKU: {item.product.sku}</small>}
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                    <Card.Footer className="text-end">
                        <Row>
                            <Col md={9} className="text-end">{t('admin.orders.detail.itemsPriceLabel')}:</Col>
                            <Col md={3} className="text-end">{formatPrice(order.itemsPrice)}</Col>
                        </Row>
                        <Row>
                            <Col md={9} className="text-end">{t('admin.orders.detail.shippingPriceLabel')}:</Col>
                            <Col md={3} className="text-end">{formatPrice(order.shippingPrice)}</Col>
                        </Row>
                        <Row>
                            <Col md={9} className="text-end">{t('admin.orders.detail.taxPriceLabel')}:</Col>
                            <Col md={3} className="text-end">{formatPrice(order.taxPrice)}</Col>
                        </Row>
                        <hr/>
                        <Row className="fw-bold fs-5">
                            <Col md={9} className="text-end">{t('admin.orders.detail.totalPriceLabel')}:</Col>
                            <Col md={3} className="text-end">{formatPrice(order.totalPrice)}</Col>
                        </Row>
                    </Card.Footer>
                </Card>
                 {order.customerNotes && (
                    <Card className="shadow-sm mt-3">
                        <Card.Header as="h5">{t('admin.orders.detail.customerNotesTitle')}</Card.Header>
                        <Card.Body>
                            <p>{order.customerNotes}</p>
                        </Card.Body>
                    </Card>
                 )}
            </Col>
        </Row>
      </Container>
    </>
  );
};

export default OrderDetailPage;
