import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Card, Button, Spinner, Alert, ListGroup, Image, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';

const CartPage = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const { cartItems, cartTotals, loading, error, updateQuantity, removeFromCart, clearClientCart } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) { // Or handle 0 as remove, but backend currently allows 0 for removal in PUT
        await removeFromCart(productId); // Treat as remove if newQuantity is 0 or less
    } else {
        await updateQuantity(productId, newQuantity);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat(currentLang === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
    }).format(price);
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" /> <p>{t('cartPage.loadingCart', 'Loading your cart...')}</p>
      </Container>
    );
  }

  if (error) {
    return <Container className="my-5"><Alert variant="danger">{t('cartPage.errorPrefix', 'Error')}: {error}</Alert></Container>;
  }

  return (
    <Container className="my-5 cart-page">
      <Helmet>
        <title>{t('pageTitles.cart', 'سلة المشتريات')}</title>
      </Helmet>
      <h1 className="mb-4 page-main-title">{t('cartPage.title', 'سلة المشتريات')}</h1>

      {cartItems.length === 0 ? (
        <Alert variant="info">
          {t('cartPage.emptyCart', 'سلة مشترياتك فارغة حالياً.')}{' '}
          <Link to="/shop">{t('cartPage.continueShoppingLink', 'الاستمرار في التسوق')}</Link>
        </Alert>
      ) : (
        <Row>
          <Col lg={8}>
            <ListGroup variant="flush">
              {cartItems.map(item => (
                item.product ? ( // Ensure product data is populated
                <ListGroup.Item key={item.product._id} className="mb-3 p-0 border rounded">
                  <Card className="border-0">
                    <Card.Body>
                      <Row className="align-items-center">
                        <Col xs={3} md={2}>
                          <Image
                            src={item.product.images && item.product.images.length > 0 ? item.product.images[0] : `https://via.placeholder.com/100x100/EFEFEF/AAAAAA?text=${currentLang === 'ar' ? item.product.name_ar : item.product.name_en}`}
                            alt={currentLang === 'ar' ? item.product.name_ar : item.product.name_en}
                            fluid
                            rounded
                          />
                        </Col>
                        <Col xs={9} md={4}>
                          <Link to={`/product/${item.product.slug_en || item.product._id}`} className="text-decoration-none">
                            <h6 className="mb-1">{currentLang === 'ar' ? item.product.name_ar : item.product.name_en}</h6>
                          </Link>
                          <small className="text-muted">{formatPrice(item.product.price)}</small>
                        </Col>
                        <Col xs={6} md={3} className="mt-2 mt-md-0">
                          <Form.Control
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.product._id, parseInt(e.target.value))}
                            min="1"
                            max={item.product.stock || 100} // Use actual stock
                            size="sm"
                            style={{width: '70px', display: 'inline-block'}}
                          />
                        </Col>
                        <Col xs={4} md={2} className="text-md-end mt-2 mt-md-0">
                          <strong>{formatPrice(item.product.price * item.quantity)}</strong>
                        </Col>
                        <Col xs={2} md={1} className="text-end mt-2 mt-md-0">
                          <Button variant="outline-danger" size="sm" onClick={() => removeFromCart(item.product._id)} title={t('cartPage.removeItemTitle')}>
                            <FontAwesomeIcon icon={faTrashAlt} />
                          </Button>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </ListGroup.Item>
                ) : null // Skip rendering if product data is missing (e.g., product deleted)
              ))}
            </ListGroup>
            <Button variant="outline-secondary" onClick={async () => await clearClientCart()} className="mt-3">
                {t('cartPage.clearCartButton', 'إفراغ السلة')}
            </Button>
          </Col>
          <Col lg={4}>
            <Card>
              <Card.Body>
                <Card.Title as="h4" className="mb-3">{t('cartPage.summary.title', 'ملخص الطلب')}</Card.Title>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>{t('cartPage.summary.subtotal', 'المجموع الفرعي')} ({cartTotals.itemCount} {t('cartPage.summary.items', 'items')})</span>
                    <span>{formatPrice(cartTotals.subtotal)}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>{t('cartPage.summary.shipping', 'الشحن')}</span>
                    <span>{cartTotals.shipping > 0 ? formatPrice(cartTotals.shipping) : t('cartPage.summary.freeShipping', 'مجاني')}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>{t('cartPage.summary.tax', 'الضريبة')}</span>
                    <span>{formatPrice(cartTotals.tax)}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between fw-bold h5">
                    <span>{t('cartPage.summary.total', 'المجموع الكلي')}</span>
                    <span>{formatPrice(cartTotals.total)}</span>
                  </ListGroup.Item>
                </ListGroup>
                <div className="d-grid mt-3">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate('/checkout')}
                    disabled={cartItems.length === 0}
                  >
                    {t('cartPage.checkoutButton', 'إتمام عملية الشراء')}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default CartPage;
