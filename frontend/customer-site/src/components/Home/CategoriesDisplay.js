import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getCategories } from '../../services/apiService'; // Adjust path as needed
import { useTranslation } from 'react-i18next';
import './CategoriesDisplay.css'; // For custom styles

const CategoriesDisplay = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getCategories();
        if (response.data && response.data.success) {
          setCategories(response.data.data);
        } else {
          setError(response.data.message || t('categoriesDisplay.errorDefault', 'Failed to load categories.'));
        }
      } catch (err) {
        setError(err.message || t('categoriesDisplay.errorNetwork', 'An error occurred while fetching categories.'));
        console.error("Fetch categories error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [t]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">{t('loading', 'Loading...')}</span>
        </Spinner>
        <p>{t('categoriesDisplay.loadingCategories', 'Loading Categories...')}</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="my-3">{t('categoriesDisplay.errorPrefix', 'Error')}: {error}</Alert>;
  }

  if (categories.length === 0) {
    return <Alert variant="info" className="my-3">{t('categoriesDisplay.noCategories', 'No categories found.')}</Alert>;
  }

  return (
    <div className="categories-display-section my-5">
      <h2 className="text-center mb-4 section-title">{t('categoriesDisplay.title', 'Shop by Category')}</h2>
      <Row xs={1} sm={2} md={3} lg={4} xl={5} className="g-4 justify-content-center">
        {categories.map((category) => (
          <Col key={category._id} className="d-flex justify-content-center">
            <Card className="category-card h-100">
              <Card.Img
                variant="top"
                src={category.imageUrl || `https://via.placeholder.com/300x200/EFEFEF/AAAAAA?text=${encodeURIComponent(currentLang === 'ar' ? category.name_ar : category.name_en)}`}
                alt={currentLang === 'ar' ? category.name_ar : category.name_en}
                className="category-card-img"
                // Add onError handler to fall back to placeholder if actual image fails to load
                onError={(e) => {
                  e.target.onerror = null; // Prevent infinite loop if placeholder also fails
                  e.target.src = `https://via.placeholder.com/300x200/EFEFEF/AAAAAA?text=${encodeURIComponent(currentLang === 'ar' ? category.name_ar : category.name_en)}`;
                }}
              />
              <Card.Body className="text-center d-flex flex-column">
                <Card.Title className="category-card-title">
                  {currentLang === 'ar' ? category.name_ar : category.name_en}
                </Card.Title>
                {/* Link to a category-specific shop page */}
                <Link to={`/shop?category=${category.slug_en || category._id}`} className="btn btn-primary mt-auto stretched-link">
                  {t('categoriesDisplay.viewProducts', 'View Products')}
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default CategoriesDisplay;
