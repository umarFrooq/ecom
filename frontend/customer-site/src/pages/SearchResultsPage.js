import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Row, Spinner, Alert, Pagination } from 'react-bootstrap'; // Removed Col, Card
import { getProducts } from '../services/apiService';
import ProductCard from '../components/Products/ProductCard'; // Import common ProductCard
// import './SearchResultsPage.css';

const SearchResultsPage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const pageParam = searchParams.get('page');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(parseInt(pageParam, 10) || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  const productsPerPage = 12; // Or get from backend if dynamic

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setLoading(false);
      setTotalPages(0);
      setTotalProducts(0);
      return;
    }

    const fetchSearchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
            search: query,
            lang: i18n.language,
            page: currentPage,
            limit: productsPerPage
        };
        const response = await getProducts(params);
        if (response.data && response.data.success) {
          setProducts(response.data.data);
          setTotalProducts(response.data.totalProducts || 0);
          setTotalPages(response.data.pagination?.next ? Math.ceil(response.data.totalProducts / productsPerPage) : currentPage); // Approximate total pages
           if (response.data.totalProducts && response.data.data.length > 0) {
             setTotalPages(Math.ceil(response.data.totalProducts / productsPerPage));
           } else if (response.data.data.length === 0 && currentPage > 1) {
             // If current page has no results but it's not the first page, means we went too far
             setTotalPages(currentPage -1);
           } else if (response.data.data.length === 0 && currentPage === 1){
              setTotalPages(0);
           }

        } else {
          setError(response.data.message || t('searchResultsPage.error.fetchDefault'));
        }
      } catch (err) {
        setError(err.error || err.message || t('searchResultsPage.error.fetchNetwork'));
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, i18n.language, currentPage, t]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Update URL search param for page, though this component re-fetches based on `currentPage` state
    // For better UX, URL should reflect current page: navigate(`?q=${query}&page=${pageNumber}`);
  };


  return (
    <Container className="my-5">
      <Helmet>
        <title>{t('pageTitles.searchResults', 'Search Results for "{{query}}"', { query })}</title>
      </Helmet>
      <h2 className="mb-4">
        {query
          ? t('searchResultsPage.title', 'Search Results for: "{{query}}"', { query })
          : t('searchResultsPage.noQueryTitle', 'Please enter a search term')
        }
      </h2>

      {loading && (
        <div className="text-center my-5">
          <Spinner animation="border" /> <p>{t('searchResultsPage.loading', 'Loading results...')}</p>
        </div>
      )}
      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && !query && (
        <Alert variant="info">{t('searchResultsPage.typeToSearch', 'Type a keyword in the search bar to find products.')}</Alert>
      )}

      {!loading && !error && query && products.length === 0 && (
        <Alert variant="warning">{t('searchResultsPage.noResults', 'No products found matching your search criteria.')}</Alert>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <p className="text-muted mb-3">
            {t('searchResultsPage.resultsFound', 'Found {{count}} products.', { count: totalProducts })}
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

export default SearchResultsPage;
