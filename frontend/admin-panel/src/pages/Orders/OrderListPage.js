import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Table, Button, Spinner, Alert, Pagination, Badge, Form, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { getAdminOrders, updateAdminOrderStatus, markOrderAsDelivered } from '../../services/adminApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faTruck } from '@fortawesome/free-solid-svg-icons';

const OrderListPage = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const navigate = useNavigate(); // Initialize useNavigate

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  // const [totalOrders, setTotalOrders] = useState(0); // totalOrders seems unused
  const ordersPerPage = 10;

  // TODO: Add filters for status, date range, search by order ID or user
  const [filterStatus, setFilterStatus] = useState('');


  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: ordersPerPage,
        sort: '-createdAt', // Default sort by newest
        orderStatus: filterStatus || undefined,
      };
      const response = await getAdminOrders(params);
      if (response.data && response.data.success) {
        setOrders(response.data.data);
        // setTotalOrders(response.data.totalOrders || 0); // totalOrders seems unused
         if (response.data.totalOrders && response.data.data.length > 0) {
           setTotalPages(Math.ceil(response.data.totalOrders / ordersPerPage));
         } else {
           setTotalPages(0);
         }
      } else {
        setError(response.data.message || t('admin.orders.list.errorFetchDefault'));
      }
    } catch (err) {
      setError(err.message || err.error || t('admin.orders.list.errorFetchNetwork'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterStatus, t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!newStatus) return; // Or handle if trying to set to empty
    if (window.confirm(t('admin.orders.list.confirmUpdateStatus', { status: newStatus }))) {
        try {
            await updateAdminOrderStatus(orderId, { orderStatus: newStatus });
            fetchOrders(); // Refresh
        } catch (updError) {
            setError(updError.message || t('admin.orders.list.errorUpdateStatus'));
        }
    }
  };

  const handleMarkDelivered = async (orderId) => {
     if (window.confirm(t('admin.orders.list.confirmMarkDelivered'))) {
        try {
            await markOrderAsDelivered(orderId);
            fetchOrders(); // Refresh
        } catch (delivError) {
            setError(delivError.message || t('admin.orders.list.errorMarkDelivered'));
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
    switch (status) {
      case 'Pending': return <Badge bg="warning" text="dark">{t('orderStatus.pending', 'Pending')}</Badge>;
      case 'Processing': return <Badge bg="info">{t('orderStatus.processing', 'Processing')}</Badge>;
      case 'Shipped': return <Badge bg="primary">{t('orderStatus.shipped', 'Shipped')}</Badge>;
      case 'Delivered': return <Badge bg="success">{t('orderStatus.delivered', 'Delivered')}</Badge>;
      case 'Cancelled': return <Badge bg="danger">{t('orderStatus.cancelled', 'Cancelled')}</Badge>;
      case 'Failed': return <Badge bg="secondary">{t('orderStatus.failed', 'Failed')}</Badge>; // Darker than danger
      default: return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };

  if (loading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }
  // Do not show main error if individual action error is shown, or clear main error on action success
  // For now, main error is for fetching list.

  return (
    <>
      <Helmet>
        <title>{t('admin.orders.list.pageTitle')} | {t('adminPanel.title')}</title>
      </Helmet>
      <Container fluid className="p-4">
        <Row className="align-items-center mb-3">
          <Col>
            <h2 className="admin-page-title">{t('admin.orders.list.title')}</h2>
          </Col>
          {/* No "Add New Order" button typically for admins, orders come from customers */}
        </Row>

        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

        <Card className="shadow-sm">
          <Card.Header>
            <Form.Group as={Row} controlId="orderStatusFilter">
              <Form.Label column sm="auto">{t('admin.orders.list.filterByStatus')}:</Form.Label>
              <Col sm={3}>
                <Form.Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1);}}>
                  <option value="">{t('admin.orders.list.allStatuses')}</option>
                  {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Failed'].map(s => (
                    <option key={s} value={s}>{t(`orderStatus.${s.toLowerCase()}`, s)}</option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="admin-table mb-0">
              <thead>
                <tr>
                  <th>{t('admin.orders.list.headerId')}</th>
                  <th>{t('admin.orders.list.headerDate')}</th>
                  <th>{t('admin.orders.list.headerCustomer')}</th>
                  <th>{t('admin.orders.list.headerTotal')}</th>
                  <th>{t('admin.orders.list.headerPaid')}</th>
                  <th>{t('admin.orders.list.headerDelivered')}</th>
                  <th>{t('admin.orders.list.headerStatus')}</th>
                  <th>{t('admin.orders.list.headerActions')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? orders.map(order => (
                  <tr key={order._id}>
                    <td>{order._id}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-CA')}</td>
                    <td>{order.user ? (order.user.firstName || order.user.username) : t('admin.orders.list.guestUser')}</td>
                    <td>{formatPrice(order.totalPrice)}</td>
                    <td>{order.isPaid ? <Badge bg="success">{t('yes')}</Badge> : <Badge bg="secondary">{t('no')}</Badge>}</td>
                    <td>{order.isDelivered ? <Badge bg="success">{t('yes')}</Badge> : <Badge bg="secondary">{t('no')}</Badge>}</td>
                    <td>{getOrderStatusBadge(order.orderStatus)}</td>
                    <td>
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-1 mb-1"
                        onClick={() => navigate(`/admin/orders/view/${order._id}`)}
                        title={t('admin.orders.list.viewAction')}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Button>
                      {!order.isDelivered && order.isPaid && order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Failed' && (
                        <Button
                            variant="outline-success"
                            size="sm"
                            className="me-1 mb-1"
                            onClick={() => handleMarkDelivered(order._id)}
                            title={t('admin.orders.list.markDeliveredAction')}
                        >
                            <FontAwesomeIcon icon={faTruck} /> {t('admin.orders.list.markDeliveredShort')}
                        </Button>
                      )}
                       <Form.Select
                            size="sm"
                            value={order.orderStatus}
                            onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                            className="d-inline-block w-auto mt-1"
                            disabled={order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled' || order.orderStatus === 'Failed'}
                        >
                            {/* <option value="" disabled>{t('admin.orders.list.changeStatusPrompt')}</option> */}
                            {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Failed'].map(s => (
                                <option key={s} value={s} disabled={s === order.orderStatus || ((order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled' || order.orderStatus === 'Failed') && s !== order.orderStatus) }>
                                    {t(`orderStatus.${s.toLowerCase()}`, s)}
                                </option>
                            ))}
                        </Form.Select>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="text-center p-4">{t('admin.orders.list.noOrdersFound')}</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
           {totalPages > 0 && orders.length > 0 && (
            <Card.Footer className="d-flex justify-content-center">
              <Pagination>
                {[...Array(totalPages).keys()].map(num => (
                  <Pagination.Item
                    key={num + 1}
                    active={num + 1 === currentPage}
                    onClick={() => setCurrentPage(num + 1)}
                  >
                    {num + 1}
                  </Pagination.Item>
                ))}
              </Pagination>
            </Card.Footer>
          )}
        </Card>
      </Container>
    </>
  );
};

export default OrderListPage;
