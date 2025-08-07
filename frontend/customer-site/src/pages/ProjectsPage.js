import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { getProjects } from '../services/apiService';
import { Card, Row, Col, Alert, Spinner, Container } from 'react-bootstrap';
// import './ProjectsPage.css'; // Optional: if specific styling is needed

const ProjectsPage = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getProjects({ lang: currentLang }); // Pass current language
        if (response.data && response.data.success) {
          setProjects(response.data.data);
        } else {
          setError(response.data.message || t('projectsPage.errorDefault', 'Failed to load projects.'));
        }
      } catch (err) {
        setError(err.message || t('projectsPage.errorNetwork', 'An error occurred while fetching projects.'));
        console.error("Fetch projects error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [t, currentLang]);

  return (
    <Container className="my-5">
      <Helmet>
        <title>{t('pageTitles.projects')}</title>
      </Helmet>
      <h2 className="text-center mb-4 section-title">{t('projectsPage.title')}</h2>

      {loading && (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">{t('loading', 'Loading...')}</span>
          </Spinner>
          <p>{t('projectsPage.loadingProjects', 'Loading Projects...')}</p>
        </div>
      )}

      {error && <Alert variant="danger" className="my-3">{t('projectsPage.errorPrefix', 'Error')}: {error}</Alert>}

      {!loading && !error && projects.length === 0 && (
        <Alert variant="info" className="my-3">{t('projectsPage.noProjects', 'No projects found at the moment.')}</Alert>
      )}

      {!loading && !error && projects.length > 0 && (
        <Row xs={1} md={2} lg={3} className="g-4">
          {projects.map((project) => (
            <Col key={project._id}>
              <Card className="h-100 project-card">
                <Card.Img
                    variant="top"
                    src={project.images && project.images.length > 0 ? project.images[0] : `https://via.placeholder.com/400x250/EFEFEF/AAAAAA?text=${currentLang === 'ar' ? project.title_ar : project.title_en}`}
                    alt={currentLang === 'ar' ? project.title_ar : project.title_en}
                    style={{ height: '250px', objectFit: 'cover' }}
                />
                <Card.Body>
                  <Card.Title>{currentLang === 'ar' ? project.title_ar : project.title_en}</Card.Title>
                  <Card.Text>
                    {currentLang === 'ar'
                      ? (project.description_ar.substring(0, 100) + (project.description_ar.length > 100 ? '...' : ''))
                      : (project.description_en.substring(0, 100) + (project.description_en.length > 100 ? '...' : ''))}
                  </Card.Text>
                  {/* Optional: Link to a detailed project page if one exists */}
                  {/* <Link to={`/projects/${project.slug_en || project._id}`} className="btn btn-sm btn-outline-primary">
                    {t('projectsPage.viewDetails', 'View Details')}
                  </Link> */}
                </Card.Body>
                {project.project_date && (
                    <Card.Footer>
                        <small className="text-muted">
                            {t('projectsPage.dateLabel', 'Date')}: {new Date(project.project_date).toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US')}
                        </small>
                    </Card.Footer>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default ProjectsPage;
