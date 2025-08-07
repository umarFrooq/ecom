import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Table, Button, Spinner, Alert, Card } from 'react-bootstrap'; // No Pagination for now for categories
import { Link, useNavigate } from 'react-router-dom';
import { getAdminCategories, deleteAdminCategory } from '../../services/adminApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faPlus } from '@fortawesome/free-solid-svg-icons';

const CategoryListPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Params for categories might be simpler, e.g., just sort
      const params = { sort: 'name_en' };
      const response = await getAdminCategories(params);
      if (response.data && response.data.success) {
        setCategories(response.data.data);
      } else {
        setError(response.data.message || t('admin.categories.list.errorFetchDefault'));
      }
    } catch (err) {
      setError(err.message || err.error || t('admin.categories.list.errorFetchNetwork'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm(t('admin.categories.list.confirmDelete'))) {
      try {
        await deleteAdminCategory(categoryId);
        fetchCategories(); // Refresh list
      } catch (delError) {
        setError(delError.message || t('admin.categories.list.errorDelete'));
      }
    }
  };

  if (loading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }
  if (error) {
    return <Container className="mt-3"><Alert variant="danger">{error}</Alert></Container>;
  }

  return (
    <>
      <Helmet>
        <title>{t('admin.categories.list.pageTitle')} | {t('adminPanel.title')}</title>
      </Helmet>
      <Container fluid className="p-4">
        <Row className="align-items-center mb-3">
          <Col md={6}>
            <h2 className="admin-page-title">{t('admin.categories.list.title')}</h2>
          </Col>
          <Col md={6} className="text-md-end">
            <Button variant="primary" as={Link} to="/admin/categories/new">
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              {t('admin.categories.list.addNewButton')}
            </Button>
          </Col>
        </Row>

        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <Table responsive hover className="admin-table mb-0">
              <thead>
                <tr>
                  <th>{t('admin.categories.list.headerImage', 'Image')}</th>
                  <th>{t('admin.categories.list.headerNameEn')}</th>
                  <th>{t('admin.categories.list.headerNameAr')}</th>
                  {/* Add other relevant headers like product count if available */}
                  <th>{t('admin.categories.list.headerActions')}</th>
                </tr>
              </thead>
              <tbody>
                {categories.length > 0 ? categories.map(category => (
                  <tr key={category._id}>
                    <td>
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={category.name_en || 'Category'}
                          style={{ height: '50px', width: '50px', objectFit: 'cover', borderRadius: '0.25rem' }}
                        />
                      ) : (
                        <span className="text-muted fst-italic">{t('admin.common.noImage', 'No Image')}</span>
                      )}
                    </td>
                    <td>{category.name_en}</td>
                    <td>{category.name_ar}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => navigate(`/admin/categories/edit/${category._id}`)}
                        title={t('admin.categories.list.editAction')}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteCategory(category._id)}
                        title={t('admin.categories.list.deleteAction')}
                      >
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="text-center p-4">{t('admin.categories.list.noCategoriesFound')}</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
          {/* Optional: Pagination if many categories */}
        </Card>
      </Container>
    </>
  );
};

export default CategoryListPage;
