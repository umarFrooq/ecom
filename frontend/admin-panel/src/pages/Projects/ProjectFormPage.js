import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Form, Button, Spinner, Alert, Card, InputGroup } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import {
    getAdminProjectById,
    createAdminProject,
    updateAdminProject,
    uploadAdminImage
} from '../../services/adminApiService';

const ProjectFormPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { projectId } = useParams(); // For editing existing project
    const isEditMode = Boolean(projectId);

    const initialFormData = {
        title_en: '', title_ar: '',
        description_en: '', description_ar: '',
        images: [],
        client_name_en: '', client_name_ar: '',
        project_date: new Date().toISOString().split('T')[0], // Default to today
        location_en: '', location_ar: '',
        category_tags_en: '', category_tags_ar: '',
        isActive: true,
    };
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(isEditMode);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [imageUploads, setImageUploads] = useState([]);
    const fileInputRef = React.createRef();

    const fetchProjectDetails = useCallback(async () => {
        if (!isEditMode) {
            setPageLoading(false);
            return;
        }
        setPageLoading(true);
        setError(null);
        try {
            const response = await getAdminProjectById(projectId);
            if (response.data && response.data.success) {
                const projectData = response.data.data;
                setFormData({
                    title_en: projectData.title_en || '',
                    title_ar: projectData.title_ar || '',
                    description_en: projectData.description_en || '',
                    description_ar: projectData.description_ar || '',
                    images: projectData.images || [],
                    client_name_en: projectData.client_name_en || '',
                    client_name_ar: projectData.client_name_ar || '',
                    project_date: projectData.project_date ? new Date(projectData.project_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    location_en: projectData.location_en || '',
                    location_ar: projectData.location_ar || '',
                    category_tags_en: projectData.category_tags_en ? projectData.category_tags_en.join(', ') : '',
                    category_tags_ar: projectData.category_tags_ar ? projectData.category_tags_ar.join(', ') : '',
                    isActive: projectData.isActive !== undefined ? projectData.isActive : true,
                });
                if (projectData.images && projectData.images.length > 0) {
                    setImageUploads(projectData.images.map(url => ({
                        id: url,
                        preview: url,
                        s3Url: url,
                        status: 'success',
                        file: null,
                    })));
                }
            } else {
                throw new Error(response.data.message || `Failed to load project ${projectId}`);
            }
        } catch (err) {
            setError(err.message || 'Error loading project data.');
            console.error("Error in project form page load:", err);
        } finally {
            setPageLoading(false);
        }
    }, [isEditMode, projectId]);

    useEffect(() => {
        fetchProjectDetails();
    }, [fetchProjectDetails]);

    useEffect(() => {
        return () => {
            imageUploads.forEach(upload => {
                if (upload.preview && upload.preview.startsWith('blob:')) {
                    URL.revokeObjectURL(upload.preview);
                }
            });
        };
    }, [imageUploads]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleFileSelect = async (event) => {
        const files = Array.from(event.target.files);
        event.target.value = null;

        const newUploads = files.map(file => ({
            id: `${file.name}-${Date.now()}`,
            file: file,
            preview: URL.createObjectURL(file),
            status: 'pending',
            s3Url: '',
            errorMsg: '',
        }));

        setImageUploads(prev => [...prev, ...newUploads]);

        newUploads.forEach(upload => {
            uploadSingleFile(upload.id, upload.file);
        });
    };

    const uploadSingleFile = async (tempId, file) => {
        setImageUploads(prev => prev.map(u => u.id === tempId ? { ...u, status: 'uploading' } : u));
        try {
            const response = await uploadAdminImage(file);
            if (response.data && response.data.success) {
                const s3Url = response.data.data.imageUrl;
                setImageUploads(prev => prev.map(u => u.id === tempId ? { ...u, status: 'success', s3Url: s3Url, preview: s3Url, file: null } : u));
                setFormData(prev => ({ ...prev, images: [...prev.images, s3Url] }));
            } else {
                throw new Error(response.data?.message || 'Upload failed');
            }
        } catch (uploadError) {
            console.error("Upload error for file:", file.name, uploadError);
            setImageUploads(prev => prev.map(u => u.id === tempId ? { ...u, status: 'error', errorMsg: uploadError.message || 'Upload failed' } : u));
        }
    };

    const removeImage = (idToRemove, s3UrlToRemove) => {
        const uploadToRemove = imageUploads.find(u => u.id === idToRemove);
        if (uploadToRemove && uploadToRemove.preview && uploadToRemove.preview.startsWith('blob:')) {
            URL.revokeObjectURL(uploadToRemove.preview);
        }

        setImageUploads(prev => prev.filter(u => u.id !== idToRemove));

        if (s3UrlToRemove) {
            setFormData(prev => ({ ...prev, images: prev.images.filter(url => url !== s3UrlToRemove) }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const stillUploading = imageUploads.some(u => u.status === 'uploading');
        if (stillUploading) {
            setError(t('admin.projects.form.errorImagesUploading', 'Some images are still uploading. Please wait.'));
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        const finalImageS3Urls = imageUploads
            .filter(u => u.status === 'success' && u.s3Url)
            .map(u => u.s3Url);

        const projectPayload = {
            ...formData,
            images: finalImageS3Urls,
            category_tags_en: formData.category_tags_en.split(',').map(tag => tag.trim()).filter(tag => tag),
            category_tags_ar: formData.category_tags_ar.split(',').map(tag => tag.trim()).filter(tag => tag),
            project_date: formData.project_date ? new Date(formData.project_date).toISOString() : undefined,
        };

        if (projectPayload.images.length === 0) {
            setError(t('admin.projects.form.errorMinOneImage'));
            setLoading(false);
            return;
        }

        try {
            let response;
            if (isEditMode) {
                response = await updateAdminProject(projectId, projectPayload);
            } else {
                response = await createAdminProject(projectPayload);
            }

            if (response.data && response.data.success) {
                setSuccess(isEditMode ? t('admin.projects.form.updateSuccess') : t('admin.projects.form.createSuccess'));
                setTimeout(() => navigate('/admin/projects-content'), 2000);
                if (!isEditMode) setFormData(initialFormData);
            } else {
                throw new Error(response.data.message || (isEditMode ? t('admin.projects.form.updateError') : t('admin.projects.form.createError')));
            }
        } catch (err) {
            setError(err.message || err.error || 'An unexpected error occurred.');
            console.error("Submit error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
    }
    if (error && !loading && isEditMode && !formData.title_en) {
         return <Container className="mt-3"><Alert variant="danger">{error}</Alert></Container>;
    }

    return (
        <>
            <Helmet>
                <title>
                    {isEditMode ? t('admin.projects.form.editTitle', { name: formData.title_en || 'Project' }) : t('admin.projects.form.newTitle')}
                    {' | '}{t('adminPanel.title')}
                </title>
            </Helmet>
            <Container fluid className="p-4">
                <Row className="mb-3">
                    <Col>
                        <h2 className="admin-page-title">
                            {isEditMode ? t('admin.projects.form.editPageHeader', { name: formData.title_en || 'Project' }) : t('admin.projects.form.newPageHeader')}
                        </h2>
                    </Col>
                </Row>
                <Card className="shadow-sm">
                    <Card.Body>
                        {error && !loading && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}
                        <Form onSubmit={handleSubmit}>
                            {/* Titles */}
                            <Row>
                                <Col md={6}><Form.Group className="mb-3" controlId="title_en">
                                    <Form.Label>{t('admin.projects.form.titleEnLabel')} <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="text" name="title_en" value={formData.title_en} onChange={handleChange} required />
                                </Form.Group></Col>
                                <Col md={6}><Form.Group className="mb-3" controlId="title_ar">
                                    <Form.Label>{t('admin.projects.form.titleArLabel')} <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="text" name="title_ar" value={formData.title_ar} onChange={handleChange} required dir="rtl" />
                                </Form.Group></Col>
                            </Row>
                            {/* Descriptions */}
                            <Row>
                                <Col md={6}><Form.Group className="mb-3" controlId="description_en">
                                    <Form.Label>{t('admin.projects.form.descriptionEnLabel')} <span className="text-danger">*</span></Form.Label>
                                    <Form.Control as="textarea" rows={3} name="description_en" value={formData.description_en} onChange={handleChange} required />
                                </Form.Group></Col>
                                <Col md={6}><Form.Group className="mb-3" controlId="description_ar">
                                    <Form.Label>{t('admin.projects.form.descriptionArLabel')} <span className="text-danger">*</span></Form.Label>
                                    <Form.Control as="textarea" rows={3} name="description_ar" value={formData.description_ar} onChange={handleChange} required dir="rtl" />
                                </Form.Group></Col>
                            </Row>
                            {/* Images */}
                            <Form.Group className="mb-3">
                                <Form.Label>{t('admin.projects.form.imagesLabel')}</Form.Label>
                                <div className="mb-2">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                    >
                                        {t('admin.projects.form.selectImagesButton', 'Select Images...')}
                                    </Button>
                                    <Form.Control
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    {imageUploads.map((upload) => (
                                        <Card key={upload.id} style={{ width: '120px' }} className="mb-2 position-relative">
                                            <Card.Img
                                                variant="top"
                                                src={upload.preview}
                                                alt="Preview"
                                                style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                                            />
                                            {upload.status === 'uploading' && (
                                                <div className="position-absolute top-50 start-50 translate-middle">
                                                    <Spinner animation="border" size="sm" />
                                                </div>
                                            )}
                                            {upload.status === 'error' && (
                                                <Card.Text
                                                    className="text-danger small p-1"
                                                    title={upload.errorMsg || t('admin.projects.form.uploadErrorTooltip', 'An unknown error occurred during upload.')}
                                                    style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                >
                                                    {upload.errorMsg ? (upload.errorMsg.length > 15 ? upload.errorMsg.substring(0, 12) + '...' : upload.errorMsg) : t('admin.projects.form.uploadErrorShort', 'Error')}
                                                </Card.Text>
                                            )}
                                             {upload.status !== 'uploading' && (
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    className="position-absolute top-0 end-0 m-1 p-1 lh-1"
                                                    onClick={() => removeImage(upload.id, upload.s3Url)}
                                                    title={t('admin.projects.form.removeImageButton', 'Remove image')}
                                                >
                                                    &times;
                                                </Button>
                                             )}
                                        </Card>
                                    ))}
                                </div>
                                <Form.Text className="d-block">
                                    {t('admin.projects.form.imagesS3Tip', 'Upload images directly. They will be saved to S3.')}
                                </Form.Text>
                            </Form.Group>
                            {/* Client, Date, Location */}
                            <Row>
                                <Col md={3}><Form.Group className="mb-3" controlId="client_name_en"><Form.Label>{t('admin.projects.form.clientEnLabel')}</Form.Label><Form.Control type="text" name="client_name_en" value={formData.client_name_en} onChange={handleChange} /></Form.Group></Col>
                                <Col md={3}><Form.Group className="mb-3" controlId="client_name_ar"><Form.Label>{t('admin.projects.form.clientArLabel')}</Form.Label><Form.Control type="text" name="client_name_ar" value={formData.client_name_ar} onChange={handleChange} dir="rtl" /></Form.Group></Col>
                                <Col md={3}><Form.Group className="mb-3" controlId="project_date"><Form.Label>{t('admin.projects.form.dateLabel')}</Form.Label><Form.Control type="date" name="project_date" value={formData.project_date} onChange={handleChange} /></Form.Group></Col>
                            </Row>
                            <Row>
                                <Col md={6}><Form.Group className="mb-3" controlId="location_en"><Form.Label>{t('admin.projects.form.locationEnLabel')}</Form.Label><Form.Control type="text" name="location_en" value={formData.location_en} onChange={handleChange} /></Form.Group></Col>
                                <Col md={6}><Form.Group className="mb-3" controlId="location_ar"><Form.Label>{t('admin.projects.form.locationArLabel')}</Form.Label><Form.Control type="text" name="location_ar" value={formData.location_ar} onChange={handleChange} dir="rtl" /></Form.Group></Col>
                            </Row>
                            {/* Category Tags */}
                            <Row>
                                <Col md={6}><Form.Group className="mb-3" controlId="category_tags_en"><Form.Label>{t('admin.projects.form.tagsEnLabel')}</Form.Label><Form.Control type="text" name="category_tags_en" value={formData.category_tags_en} onChange={handleChange} /><Form.Text>{t('admin.projects.form.tagsTip')}</Form.Text></Form.Group></Col>
                                <Col md={6}><Form.Group className="mb-3" controlId="category_tags_ar"><Form.Label>{t('admin.projects.form.tagsArLabel')}</Form.Label><Form.Control type="text" name="category_tags_ar" value={formData.category_tags_ar} onChange={handleChange} dir="rtl" /><Form.Text>{t('admin.projects.form.tagsTip')}</Form.Text></Form.Group></Col>
                            </Row>
                            {/* Is Active */}
                            <Form.Group className="mb-4" controlId="isActive">
                                <Form.Check type="switch" name="isActive" label={t('admin.projects.form.isActiveLabel')} checked={formData.isActive} onChange={handleChange} />
                            </Form.Group>

                            <Button variant="success" type="submit" disabled={loading || pageLoading}>
                                {loading ? <Spinner as="span" animation="border" size="sm" /> : (isEditMode ? t('admin.projects.form.saveChangesButton') : t('admin.projects.form.createProjectButton'))}
                            </Button>
                            <Button variant="secondary" className="ms-2" onClick={() => navigate('/admin/projects-content')} disabled={loading || pageLoading}>
                                {t('admin.common.cancelButton')}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
};

export default ProjectFormPage;
