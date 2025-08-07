import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Table, Button, Spinner, Alert, Pagination, InputGroup, Form, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminProducts, deleteAdminProduct } from '../../services/adminApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
// import './ProductListPage.css'; // Optional

const ProductListPage = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  // const [totalProducts, setTotalProducts] = useState(0); // totalProducts seems unused
  const productsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterIsActive, setFilterIsActive] = useState(''); // 'true', 'false', or '' for all

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: productsPerPage,
        sort: '-createdAt', // Default sort
        search: searchTerm || undefined, // Pass undefined if empty
        isActive: filterIsActive || undefined, // Pass 'all' or true/false; backend needs to handle 'all' or undefined as "no filter on isActive"
        // The current getProducts in backend defaults to isActive:true if not admin and isActive not specified.
        // For admin, we might want to pass isActive explicitly or have backend show all if isActive not specified by admin.
        // For now, getAdminProducts should ensure it can fetch all or filter by isActive.
        // Let's assume adminApiService's getAdminProducts passes a param like `status: 'all'` if no isActive filter is set by UI.
        // Or, the backend /products route for GET needs to check if user is admin to show inactive products.
        // For simplicity, let's assume backend's getProducts for admin shows all if isActive is not 'true' or 'false'.
      };
      if (filterIsActive) params.isActive = filterIsActive;


      const response = await getAdminProducts(params);
      if (response.data && response.data.success) {
        setProducts(response.data.data);
        // setTotalProducts(response.data.totalProducts || 0); // totalProducts seems unused
        setTotalPages(response.data.pagination?.next ? Math.ceil(response.data.totalProducts / productsPerPage) : currentPage);
         if (response.data.totalProducts && response.data.data.length > 0) {
             setTotalPages(Math.ceil(response.data.totalProducts / productsPerPage));
           } else {
             setTotalPages(0);
           }
      } else {
        setError(response.data.message || t('admin.products.list.errorFetchDefault'));
      }
    } catch (err) {
      setError(err.message || err.error || t('admin.products.list.errorFetchNetwork'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterIsActive, t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = async (productId) => {
    if (window.confirm(t('admin.products.list.confirmDelete'))) {
      try {
        await deleteAdminProduct(productId);
        // Refresh list
        fetchProducts();
        // Could also filter out locally: setProducts(products.filter(p => p._id !== productId));
      } catch (delError) {
        setError(delError.message || t('admin.products.list.errorDelete'));
      }
    }
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleSearchSubmit = (e) => { e.preventDefault(); setCurrentPage(1); fetchProducts(); };
  const handleFilterChange = (e) => { setFilterIsActive(e.target.value); setCurrentPage(1); };


  if (loading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }
  if (error) {
    return <Container className="mt-3"><Alert variant="danger">{error}</Alert></Container>;
  }

  return (
    <>
      <Helmet>
        <title>{t('admin.products.list.pageTitle')} | {t('adminPanel.title')}</title>
      </Helmet>
      <Container fluid className="p-4">
        <Row className="align-items-center mb-3">
          <Col md={5}>
            <h2 className="admin-page-title">{t('admin.products.list.title')}</h2>
          </Col>
          <Col md={7} className="text-md-end">
            <Button variant="primary" as={Link} to="/admin/products/new">
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              {t('admin.products.list.addNewButton')}
            </Button>
          </Col>
        </Row>

        <Card className="shadow-sm">
          <Card.Header>
            <Row>
                <Col md={6}>
                    <Form onSubmit={handleSearchSubmit}>
                        <InputGroup>
                            <Form.Control
                                type="text"
                                placeholder={t('admin.products.list.searchPlaceholder')}
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                            <Button type="submit" variant="outline-secondary">
                                <FontAwesomeIcon icon={faSearch} />
                            </Button>
                        </InputGroup>
                    </Form>
                </Col>
                <Col md={3}>
                     <Form.Select value={filterIsActive} onChange={handleFilterChange}>
                        <option value="">{t('admin.products.list.filterStatusAll')}</option>
                        <option value="true">{t('admin.products.list.filterStatusActive')}</option>
                        <option value="false">{t('admin.products.list.filterStatusInactive')}</option>
                    </Form.Select>
                </Col>
            </Row>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="admin-table mb-0">
              <thead>
                <tr>
                  <th>{t('admin.products.list.headerImage')}</th>
                  <th>{t('admin.products.list.headerNameEn')}</th>
                  <th>{t('admin.products.list.headerNameAr')}</th>
                  <th>{t('admin.products.list.headerCategory')}</th>
                  <th>{t('admin.products.list.headerPrice')}</th>
                  <th>{t('admin.products.list.headerStock')}</th>
                  <th>{t('admin.products.list.headerStatus')}</th>
                  <th>{t('admin.products.list.headerActions')}</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? products.map(product => (
                  <tr key={product._id}>
                    <td>
                      <img
                        src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/50'}
                        alt={currentLang === 'ar' ? product.name_ar : product.name_en}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    </td>
                    <td>{product.name_en}</td>
                    <td>{product.name_ar}</td>
                    <td>{product.category ? (currentLang === 'ar' ? product.category.name_ar : product.category.name_en) : 'N/A'}</td>
                    <td>{product.price}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span className={`badge bg-${product.isActive ? 'success' : 'danger'}`}>
                        {product.isActive ? t('admin.products.list.statusActive') : t('admin.products.list.statusInactive')}
                      </span>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                        title={t('admin.products.list.editAction')}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteProduct(product._id)}
                        title={t('admin.products.list.deleteAction')}
                      >
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="text-center p-4">{t('admin.products.list.noProductsFound')}</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
          {totalPages > 0 && products.length > 0 && (
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

export default ProductListPage;
