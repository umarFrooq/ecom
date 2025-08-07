import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Card, Button, Spinner, Alert, Form, ListGroup, Badge } from 'react-bootstrap';
import { getProductByIdentifier, getProductReviews, addProductReview } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext'; // Import useCart
// import './ProductDetailPage.css'; // Optional

// Simple Image Gallery/Carousel (can be replaced with a library like react-image-gallery)
const ProductImageGallery = ({ images, productName }) => {
    const [mainImage, setMainImage] = useState(images && images.length > 0 ? images[0] : '');

    useEffect(() => {
        if (images && images.length > 0) {
            setMainImage(images[0]);
        }
    }, [images]);

    if (!images || images.length === 0) {
        return <img src={`https://via.placeholder.com/600x400/EFEFEF/AAAAAA?text=${encodeURIComponent(productName)}`} alt={productName} className="img-fluid rounded mb-3" />;
    }

    return (
        <div>
            <img src={mainImage} alt={productName} className="img-fluid rounded main-product-image mb-3" style={{ maxHeight: '400px', width: '100%', objectFit: 'contain' }}/>
            {images.length > 1 && (
                <Row xs={3} sm={4} md={5} className="g-2 thumbnail-gallery">
                    {images.map((img, index) => (
                        <Col key={index}>
                            <img
                                src={img}
                                alt={`${productName} thumbnail ${index + 1}`}
                                className={`img-thumbnail ${img === mainImage ? 'active' : ''}`}
                                onClick={() => setMainImage(img)}
                                style={{ cursor: 'pointer', height: '80px', objectFit: 'cover', width: '100%' }}
                            />
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

const ProductReviews = ({ productId, productName }) => {
    const { t, i18n } = useTranslation();
    const { isAuthenticated, user, token } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
    const [submitStatus, setSubmitStatus] = useState({ loading: false, error: null, success: null });

    const fetchReviews = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getProductReviews(productId);
            if (response.data && response.data.success) {
                setReviews(response.data.data);
            } else {
                setError(response.data.message || t('productDetailPage.reviews.errorFetchDefault'));
            }
        } catch (err) {
            setError(err.error || err.message || t('productDetailPage.reviews.errorFetchNetwork'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (productId) fetchReviews();
    }, [productId]);

    const handleReviewChange = (e) => {
        const { name, value } = e.target;
        setNewReview(prev => ({ ...prev, [name]: name === 'rating' ? parseInt(value) : value }));
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!newReview.rating || newReview.rating < 1 || newReview.rating > 5) {
            setSubmitStatus({ loading: false, error: t('productDetailPage.reviews.errorRatingRequired'), success: null });
            return;
        }
        setSubmitStatus({ loading: true, error: null, success: null });
        try {
            const response = await addProductReview(productId, newReview, token);
            if (response.data && response.data.success) {
                setSubmitStatus({ loading: false, error: null, success: t('productDetailPage.reviews.submitSuccess') });
                setNewReview({ rating: 0, comment: '' });
                setShowReviewForm(false);
                fetchReviews(); // Refresh reviews list
            } else {
                setSubmitStatus({ loading: false, error: response.data.message || t('productDetailPage.reviews.submitErrorDefault'), success: null });
            }
        } catch (err) {
            setSubmitStatus({ loading: false, error: err.error || err.message || t('productDetailPage.reviews.submitErrorNetwork'), success: null });
        }
    };

    // Check if current user has already reviewed this product
    const userHasReviewed = reviews.some(review => review.user?._id === user?._id);


    return (
        <div className="mt-5 product-reviews-section">
            <h4>{t('productDetailPage.reviews.title', 'Customer Reviews')} ( {reviews.length} )</h4>
            {loading && <Spinner animation="border" size="sm" />}
            {error && <Alert variant="danger">{error}</Alert>}

            {!loading && !error && reviews.length === 0 && (
                <p>{t('productDetailPage.reviews.noReviews', 'No reviews yet for {{productName}}.', { productName })}</p>
            )}

            {reviews.length > 0 && (
                <ListGroup variant="flush" className="mb-3">
                    {reviews.map(review => (
                        <ListGroup.Item key={review._id} className="mb-2 p-3 border rounded">
                            <strong>{review.username || t('productDetailPage.reviews.anonymousUser')}</strong>
                            <div className="mb-1">
                                {[...Array(5)].map((_, i) => (
                                    <i key={i} className={`fa-star ${i < review.rating ? 'fas text-warning' : 'far'}`}></i>
                                ))}
                                <small className="text-muted ms-2"> - {new Date(review.createdAt).toLocaleDateString(i18n.language)}</small>
                            </div>
                            <p className="mb-0">{review.comment}</p>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}

            {isAuthenticated && !userHasReviewed && (
                <Button variant="outline-primary" onClick={() => setShowReviewForm(!showReviewForm)} className="mb-3">
                    {showReviewForm ? t('productDetailPage.reviews.cancelReviewButton') : t('productDetailPage.reviews.writeReviewButton')}
                </Button>
            )}
             {isAuthenticated && userHasReviewed && (
                 <Alert variant="info">{t('productDetailPage.reviews.alreadyReviewed', 'You have already reviewed this product.')}</Alert>
             )}


            {showReviewForm && isAuthenticated && (
                <Card className="p-3">
                    <h5>{t('productDetailPage.reviews.formTitle', 'Write a Review')}</h5>
                    <Form onSubmit={handleReviewSubmit}>
                        <Form.Group className="mb-3" controlId="reviewRating">
                            <Form.Label>{t('productDetailPage.reviews.ratingLabel', 'Rating')}</Form.Label>
                            <Form.Select name="rating" value={newReview.rating} onChange={handleReviewChange} required>
                                <option value="0" disabled>{t('productDetailPage.reviews.selectRating', 'Select Rating...')}</option>
                                <option value="5">5 - {t('productDetailPage.reviews.starsExcellent', 'Excellent')}</option>
                                <option value="4">4 - {t('productDetailPage.reviews.starsGood', 'Good')}</option>
                                <option value="3">3 - {t('productDetailPage.reviews.starsAverage', 'Average')}</option>
                                <option value="2">2 - {t('productDetailPage.reviews.starsFair', 'Fair')}</option>
                                <option value="1">1 - {t('productDetailPage.reviews.starsPoor', 'Poor')}</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="reviewComment">
                            <Form.Label>{t('productDetailPage.reviews.commentLabel', 'Comment')}</Form.Label>
                            <Form.Control as="textarea" name="comment" rows={3} value={newReview.comment} onChange={handleReviewChange} />
                        </Form.Group>
                        {submitStatus.success && <Alert variant="success">{submitStatus.success}</Alert>}
                        {submitStatus.error && <Alert variant="danger">{submitStatus.error}</Alert>}
                        <Button type="submit" variant="primary" disabled={submitStatus.loading}>
                            {submitStatus.loading ? t('submitting', 'Submitting...') : t('productDetailPage.reviews.submitButton', 'Submit Review')}
                        </Button>
                    </Form>
                </Card>
            )}
        </div>
    );
};


const ProductDetailPage = () => {
  const { t, i18n } = useTranslation();
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { addToCart, error: cartError, setError: setCartError, loading: cartLoading } = useCart(); // Use CartContext
  const [addedToCartMessage, setAddedToCartMessage] = useState('');


  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getProductByIdentifier(identifier);
        if (response.data && response.data.success) {
          setProduct(response.data.data);
        } else {
          setError(response.data.message || t('productDetailPage.error.fetchDefault'));
        }
      } catch (err) {
        setError(err.error || err.message || t('productDetailPage.error.fetchNetwork'));
      } finally {
        setLoading(false);
      }
    };
    if (identifier) {
      fetchProduct();
    } else {
      navigate('/404'); // Or shop page
    }
  }, [identifier, navigate, t]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && (!product.stock || value <= product.stock)) { // Check against stock if available
      setQuantity(value);
    } else if (value <= 0) {
      setQuantity(1);
    }
  };

  const handleAddToCart = async () => {
    if (product) {
      setCartError(null); // Clear previous cart errors
      setAddedToCartMessage('');
      const success = await addToCart(product._id, quantity);
      if (success) {
        setAddedToCartMessage(t('productDetailPage.addedToCartSuccess', '{{quantity}} x {{productName}} added to cart!', {quantity, productName}));
        // Optionally navigate to cart or show a more persistent success message/toast
        // navigate('/cart');
      } else {
        // Error is handled by CartContext and displayed via cartError if needed globally
        // Or display a local error message based on cartError from context
      }
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return '';
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
    }).format(price);
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" /> <p>{t('productDetailPage.loadingProduct', 'Loading product details...')}</p>
      </Container>
    );
  }

  if (error) {
    return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  if (!product) {
    return <Container className="my-5"><Alert variant="warning">{t('productDetailPage.notFound', 'Product not found.')}</Alert></Container>;
  }

  const productName = i18n.language === 'ar' ? product.name_ar : product.name_en;
  const productDescription = i18n.language === 'ar' ? product.description_ar : product.description_en;
  const categoryName = product.category ? (i18n.language === 'ar' ? product.category.name_ar : product.category.name_en) : '';


  return (
    <Container className="my-5 product-detail-page">
      <Helmet>
        <title>{productName} | {t('companyName')}</title>
        <meta name="description" content={productDescription.substring(0,160)} />
      </Helmet>
      <Row>
        <Col md={6} className="mb-3 mb-md-0">
          <ProductImageGallery images={product.images} productName={productName} />
        </Col>
        <Col md={6}>
          <h1 className="product-title">{productName}</h1>
          {categoryName && (
            <p className="text-muted product-category">
                {t('productDetailPage.categoryLabel', 'Category')}: {categoryName}
            </p>
          )}

          <div className="product-rating mb-2">
            {[...Array(5)].map((_, i) => (
                <i key={i} className={`fa-star ${i < Math.round(product.averageRating || 0) ? 'fas text-warning' : 'far text-muted'}`}></i>
            ))}
            <span className="ms-2 text-muted">({product.numReviews || 0} {t('productDetailPage.reviewsLink', 'reviews')})</span>
          </div>

          <p className="product-price display-6 my-3">{formatPrice(product.price)}</p>

          <div className="product-availability mb-3">
            {product.stock > 0
              ? <Badge bg="success">{t('productDetailPage.inStock', 'In Stock')} ({product.stock} {t('productDetailPage.left', 'left')})</Badge>
              : <Badge bg="danger">{t('productDetailPage.outOfStock', 'Out of Stock')}</Badge>
            }
          </div>

          <p className="product-description lead">{productDescription}</p>

          {/* Add to Cart Section */}
          {product.stock > 0 && (
            <Row className="align-items-center my-4 g-2">
              <Col xs="auto">
                <Form.Label htmlFor="quantityInput" className="mb-0 me-2">{t('productDetailPage.quantity', 'Quantity')}:</Form.Label>
              </Col>
              <Col xs={3} sm={2} md={3} lg={2}>
                <Form.Control
                  type="number"
                  id="quantityInput"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                  max={product.stock || 100} // Max to stock or a reasonable number
                  className="text-center"
                />
              </Col>
              <Col xs="auto">
                <Button variant="primary" size="lg" onClick={handleAddToCart} disabled={product.stock <= 0 || cartLoading}>
                  {cartLoading ? (
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  ) : (
                    <i className="fas fa-shopping-cart me-2"></i>
                  )}
                  {t('productDetailPage.addToCartButton', 'Add to Cart')}
                </Button>
              </Col>
            </Row>
          )}
          {addedToCartMessage && (
            <Alert variant="success" className="mt-3">
              {addedToCartMessage}
              <div className="mt-2">
                <Button variant="secondary" onClick={() => navigate('/shop')} className="me-2">
                  {t('productDetailPage.continueShoppingButton', 'Continue Shopping')}
                </Button>
                <Button variant="primary" onClick={() => navigate('/checkout')}>
                  {t('productDetailPage.checkoutButton', 'Checkout')}
                </Button>
              </div>
            </Alert>
          )}
          {cartError && <Alert variant="danger" className="mt-3">{cartError}</Alert>} {/* Display cart context error */}

          {/* Optional: SKU, Tags, etc. */}
          {product.sku && <p className="text-muted small">{t('productDetailPage.skuLabel', 'SKU')}: {product.sku}</p>}
           {product.tags_en && product.tags_en.length > 0 && (
            <p className="text-muted small">
                {t('productDetailPage.tagsLabel', 'Tags')}: { (i18n.language === 'ar' && product.tags_ar ? product.tags_ar : product.tags_en).join(', ') }
            </p>
           )}

        </Col>
      </Row>

      <Row className="mt-5">
          <Col>
            <ProductReviews productId={product._id} productName={productName} />
          </Col>
      </Row>

      {/* TODO: Related Products Section */}

    </Container>
  );
};

export default ProductDetailPage;
