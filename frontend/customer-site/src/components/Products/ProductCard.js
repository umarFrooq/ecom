import React from 'react';
import { Card, Col } from 'react-bootstrap'; // No Button needed if card is fully linked
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ProductCard.css'; // We'll create this for custom styles

const ProductCard = ({ product }) => {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language;

  // Determine language-specific fields
  const name = currentLang === 'ar' ? product.name_ar : product.name_en;
  const description = currentLang === 'ar' ? product.description_ar : product.description_en;
  // Use English slug for URL consistency, or make slugs language-specific if routes support it
  const slug = product.slug_en || product._id; // Fallback to ID if slug_en is not available

  const formatPrice = (price) => {
    return new Intl.NumberFormat(currentLang === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR', // TODO: Make currency dynamic or configurable if needed
    }).format(price);
  };

  return (
    // Using Col here makes it easy to integrate into Bootstrap Rows
    <Col xs={12} sm={6} md={4} lg={3} className="mb-4 d-flex align-items-stretch product-col">
      <Card className="h-100 product-card shadow-sm">
        <Link to={`/product/${slug}`} className="product-card-link">
          <Card.Img
            variant="top"
            src={product.images && product.images.length > 0 ? product.images[0] : `https://via.placeholder.com/300x200/EFEFEF/AAAAAA?text=${encodeURIComponent(name)}`}
            alt={name}
            className="product-card-img"
          />
          <Card.Body className="d-flex flex-column">
            <Card.Title className="product-card-title">{name}</Card.Title>
            <Card.Text className="product-card-description text-muted small flex-grow-1">
              {description.substring(0, 70) + (description.length > 70 ? '...' : '')}
            </Card.Text>
            <div className=" product-card-footer">
              <p className=" product-price mb-0">{formatPrice(product.price)}</p>
              {/* "View Details" button can be part of the link or an explicit button if needed */}
            </div>
          </Card.Body>
        </Link>
      </Card>
    </Col>
  );
};

export default ProductCard;
