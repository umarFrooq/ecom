import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Spinner, Alert, Pagination, Form } from 'react-bootstrap'; // Removed Button for now
import { useSearchParams } from 'react-router-dom'; // useNavigate removed, setSearchParams updates URL
import { getProducts, getCategories } from '../services/apiService';
import ProductCard from '../components/Products/ProductCard';
// import './ShopPage.css'; // Optional for specific styling

const ShopPage = () => {
  const { t, i18n } = useTranslation();
  // const navigate = useNavigate(); // Not strictly needed if setSearchParams handles URL updates for state
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and Sorting State - initialize from URL search params
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '-createdAt'); // Default sort: newest

  // Pagination State
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page'), 10) || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 12;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        if (response.data && response.data.success) {
          setCategories(response.data.data);
        }
      } catch (catError) {
        console.error("Failed to fetch categories for shop filter:", catError);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    // Update local state if URL search params change (e.g., browser back/forward)
    setSelectedCategory(searchParams.get('category') || '');
    setSearchTerm(searchParams.get('search') || '');
    setSortBy(searchParams.get('sort') || '-createdAt');
    setCurrentPage(parseInt(searchParams.get('page'), 10) || 1);
  }, [searchParams]);


  useEffect(() => {
    const fetchShopProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: currentPage,
          limit: productsPerPage,
          sort: sortBy,
          lang: i18n.language,
        };
        if (selectedCategory) params.category = selectedCategory;
        if (searchTerm) params.search = searchTerm;

        const response = await getProducts(params);
        if (response.data && response.data.success) {
          setProducts(response.data.data);
          setTotalProducts(response.data.totalProducts || 0);
          if (response.data.totalProducts && response.data.data.length > 0) {
            setTotalPages(Math.ceil(response.data.totalProducts / productsPerPage));
          } else {
            setTotalPages(0);
          }
        } else {
          setError(response.data.message || t('shopPage.error.fetchDefault'));
          setProducts([]);
          setTotalPages(0);
        }
      } catch (err) {
        setError(err.error || err.message || t('shopPage.error.fetchNetwork'));
        setProducts([]);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    fetchShopProducts();
  }, [selectedCategory, searchTerm, sortBy, currentPage, i18n.language, t]);

  // Function to update URL search params, which triggers the useEffect above
  const updateFiltersInUrl = (newFilters) => {
    const currentParams = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        currentParams.set(key, value);
      } else {
        currentParams.delete(key);
      }
    });
    // Reset page to 1 when filters change, unless page is the filter being changed
    if (!newFilters.hasOwnProperty('page')) {
        currentParams.set('page', '1');
    }
    setSearchParams(currentParams, { replace: true });
  };

  const handleCategoryChange = (e) => {
    updateFiltersInUrl({ category: e.target.value, page: '1' });
  };

  const handleSortChange = (e) => {
    updateFiltersInUrl({ sort: e.target.value, page: '1' });
  };

  const handleSearchTermChange = (e) => { // Renamed from handleSearchChange to avoid conflict
    setSearchTerm(e.target.value); // Update local state for input control
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFiltersInUrl({ search: searchTerm, page: '1' });
  };

  const handlePageChange = (pageNumber) => {
    updateFiltersInUrl({ page: pageNumber.toString() });
  };

  return (
    <Container className="my-1 shop-page">
      <Helmet>
        <title>{t('pageTitles.shop', 'المتجــــــر')}</title>
      </Helmet>
      {/* <Row className="mb-4">
        <Col md={12}>
          <h1 className="page-main-titable">{t('shopPage.title', 'المتجــــــر')}</h1>
        </Col>
      </Row> */}

      <Row className="mb-4 p-3 bg-light rounded">
        <Col md={4} className="mb-2 mb-md-0">
          <Form.Group controlId="categoryFilter">
            <Form.Label>{t('shopPage.filters.category', 'Filter by Category:')}</Form.Label>
            <Form.Select value={selectedCategory} onChange={handleCategoryChange}>
              <option value="">{t('shopPage.filters.allCategories', 'All Categories')}</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {i18n.language === 'ar' ? cat.name_ar : cat.name_en}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4} className="mb-2 mb-md-0">
          <Form.Group controlId="sortProducts">
            <Form.Label>{t('shopPage.filters.sortBy', 'Sort By:')}</Form.Label>
            <Form.Select value={sortBy} onChange={handleSortChange}>
              <option value="-createdAt">{t('shopPage.filters.sortNewest', 'Newest')}</option>
              <option value="price">{t('shopPage.filters.sortPriceAsc', 'Price: Low to High')}</option>
              <option value="-price">{t('shopPage.filters.sortPriceDesc', 'Price: High to Low')}</option>
              <option value="-averageRating">{t('shopPage.filters.sortPopularity', 'Popularity')}</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form onSubmit={handleSearchSubmit}>
            <Form.Label>{t('shopPage.filters.searchProducts', 'Search Products:')}</Form.Label>
            <Form.Control
                type="search"
                placeholder={t('shopPage.filters.searchPlaceholder', 'Enter keyword...')}
                value={searchTerm} // Controlled input
                onChange={handleSearchTermChange}
            />
            {/* Submit on enter or by a button if added */}
          </Form>
        </Col>
      </Row>

      {loading && (
        <div className="text-center my-5">
          <Spinner animation="border" /> <p>{t('shopPage.loadingProducts', 'Loading products...')}</p>
        </div>
      )}
      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && products.length === 0 && (
        <Alert variant="info">{t('shopPage.noProductsFound', 'No products found matching your criteria.')}</Alert>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <p className="text-muted mb-3">
            {t('shopPage.resultsCount', 'Showing {{count}} of {{total}} products', { count: products.length, total: totalProducts })}
          </p>
          <Row>
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </Row>
          {totalPages > 1 && (
            <Pagination className="justify-content-center mt-4">
              {[...Array(totalPages).keys()].map(number => (
                <Pagination.Item
                    key={number + 1}
                    active={number + 1 === currentPage}
                    onClick={() => handlePageChange(number + 1)}
                >
                  {number + 1}
                </Pagination.Item>
              ))}
            </Pagination>
          )}
        </>
      )}
    </Container>
  );
};

export default ShopPage;
