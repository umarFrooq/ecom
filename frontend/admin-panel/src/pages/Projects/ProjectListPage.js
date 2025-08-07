import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Table, Button, Spinner, Alert, Pagination, Card, Form, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminProjects, deleteAdminProject } from '../../services/adminApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';

const ProjectListPage = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  // const [totalProjects, setTotalProjects] = useState(0); // Backend getAdminProjects returns 'count'
  const projectsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterIsActive, setFilterIsActive] = useState(''); // 'true', 'false', or '' for all

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: projectsPerPage,
        sort: '-project_date', // Default sort by project date
        search: searchTerm || undefined,
        isActive: filterIsActive || undefined, // adminApiService sets status='all' if this is undefined
        lang: currentLang, // For search context
      };

      const response = await getAdminProjects(params);
      if (response.data && response.data.success) {
        setProjects(response.data.data);
        // setTotalProjects(response.data.count); // Assuming 'count' is total for pagination
        // The getAdminProjects in service sets status: 'all' so it should return all projects count
        // If backend getProjects doesn't provide total for 'all' status, pagination might be tricky.
        // For now, assume 'count' is the relevant total for current filters.
        // This might need adjustment based on actual backend response for totalProjects when status='all'.
        // For now, let's assume 'count' is the total available for the current query.
        const totalFetched = response.data.count || response.data.data.length;
        setTotalPages(Math.ceil(totalFetched / projectsPerPage));
        if (totalFetched === 0) setTotalPages(0);

      } else {
        setError(response.data.message || t('admin.projects.list.errorFetchDefault'));
      }
    } catch (err) {
      setError(err.message || err.error || t('admin.projects.list.errorFetchNetwork'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterIsActive, currentLang, t]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDeleteProject = async (projectId) => {
    if (window.confirm(t('admin.projects.list.confirmDelete'))) {
      try {
        await deleteAdminProject(projectId);
        fetchProjects();
      } catch (delError) {
        setError(delError.message || t('admin.projects.list.errorDelete'));
      }
    }
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleSearchSubmit = (e) => { e.preventDefault(); setCurrentPage(1); fetchProjects(); };
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
        <title>{t('admin.projects.list.pageTitle')} | {t('adminPanel.title')}</title>
      </Helmet>
      <Container fluid className="p-4">
        <Row className="align-items-center mb-3">
          <Col md={5}>
            <h2 className="admin-page-title">{t('admin.projects.list.title')}</h2>
          </Col>
          <Col md={7} className="text-md-end">
            <Button variant="primary" as={Link} to="/admin/projects-content/new">
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              {t('admin.projects.list.addNewButton')}
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
                                placeholder={t('admin.projects.list.searchPlaceholder')}
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
                        <option value="">{t('admin.projects.list.filterStatusAll')}</option>
                        <option value="true">{t('admin.projects.list.filterStatusActive')}</option>
                        <option value="false">{t('admin.projects.list.filterStatusInactive')}</option>
                    </Form.Select>
                </Col>
            </Row>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive hover className="admin-table mb-0">
              <thead>
                <tr>
                  <th>{t('admin.projects.list.headerImage')}</th>
                  <th>{t('admin.projects.list.headerTitleEn')}</th>
                  <th>{t('admin.projects.list.headerTitleAr')}</th>
                  <th>{t('admin.projects.list.headerDate')}</th>
                  <th>{t('admin.projects.list.headerStatus')}</th>
                  <th>{t('admin.projects.list.headerActions')}</th>
                </tr>
              </thead>
              <tbody>
                {projects.length > 0 ? projects.map(project => (
                  <tr key={project._id}>
                    <td>
                      <img
                        src={project.images && project.images.length > 0 ? project.images[0] : 'https://via.placeholder.com/50'}
                        alt={currentLang === 'ar' ? project.title_ar : project.title_en}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    </td>
                    <td>{project.title_en}</td>
                    <td>{project.title_ar}</td>
                    <td>{new Date(project.project_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge bg-${project.isActive ? 'success' : 'danger'}`}>
                        {project.isActive ? t('admin.projects.list.statusActive') : t('admin.projects.list.statusInactive')}
                      </span>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => navigate(`/admin/projects-content/edit/${project._id}`)}
                        title={t('admin.projects.list.editAction')}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteProject(project._id)}
                        title={t('admin.projects.list.deleteAction')}
                      >
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="text-center p-4">{t('admin.projects.list.noProjectsFound')}</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
          {totalPages > 0 && projects.length > 0 && (
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

export default ProjectListPage;
