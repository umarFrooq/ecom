import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Form, Button, Spinner, Alert, Card } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import {
    getAdminCategoryById,
    createAdminCategory,
    updateAdminCategory
} from '../../services/adminApiService';

const CategoryFormPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { categoryId } = useParams();
    const isEditMode = Boolean(categoryId);

    const initialFormData = { name_en: '', name_ar: '', imageUrl: '' }; // Added imageUrl
    const [formData, setFormData] = useState(initialFormData);
    const [imageFile, setImageFile] = useState(null); // For the selected image file
    const [imagePreview, setImagePreview] = useState(''); // For displaying current or new image preview

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(isEditMode);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const fetchCategory = useCallback(async () => {
        if (!isEditMode) {
            setPageLoading(false);
            return;
        }
        setPageLoading(true);
        setError(null);
        try {
            const response = await getAdminCategoryById(categoryId);
            if (response.data && response.data.success) {
                const categoryData = response.data.data;
                setFormData({
                    name_en: categoryData.name_en || '',
                    name_ar: categoryData.name_ar || '',
                    imageUrl: categoryData.imageUrl || '', // Store existing image URL
                });
                if (categoryData.imageUrl) {
                    setImagePreview(categoryData.imageUrl); // Set preview for existing image
                }
            } else {
                throw new Error(response.data.message || `Failed to load category ${categoryId}`);
            }
        } catch (err) {
            setError(err.message || 'Error loading category data.');
            console.error("Error in category form page load:", err);
        } finally {
            setPageLoading(false);
        }
    }, [isEditMode, categoryId]);

    useEffect(() => {
        fetchCategory();
    }, [fetchCategory]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            // Optionally, clear formData.imageUrl if you want to ensure the new file is treated as "the" image
            // setFormData(prev => ({ ...prev, imageUrl: '' }));
        } else {
            // If no file is selected (e.g., user cancels file dialog), revert to original image if it exists
            setImageFile(null);
            setImagePreview(formData.imageUrl || '');
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview('');
        setFormData(prev => ({ ...prev, imageUrl: '', removeImage: true })); // Signal backend to remove image
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const dataToSend = new FormData();
            dataToSend.append('name_en', formData.name_en);
            dataToSend.append('name_ar', formData.name_ar);

            if (imageFile) {
                dataToSend.append('image', imageFile);
            } else if (formData.removeImage && isEditMode) { // If image explicitly removed
                dataToSend.append('removeImage', 'true');
            }
            // If !imageFile and !formData.removeImage, and isEditMode, the existing formData.imageUrl (if any) remains on backend unless replaced.

            let response;
            if (isEditMode) {
                response = await updateAdminCategory(categoryId, dataToSend);
            } else {
                response = await createAdminCategory(dataToSend);
            }

            if (response.data && response.data.success) {
                setSuccess(isEditMode ? t('admin.categories.form.updateSuccess') : t('admin.categories.form.createSuccess'));
                setTimeout(() => navigate('/admin/categories'), 2000);
                if (!isEditMode) {
                    setFormData(initialFormData);
                    setImageFile(null);
                    setImagePreview('');
                } else {
                    // After successful update, refetch category data to get the latest imageUrl if it changed
                    fetchCategory();
                    setImageFile(null); // Clear selected file, preview will be updated by fetchCategory
                }
            } else {
                throw new Error(response.data.message || (isEditMode ? t('admin.categories.form.updateError') : t('admin.categories.form.createError')));
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
    // Initial load error for category data
    if (error && !loading && isEditMode && !formData.name_en) {
         return <Container className="mt-3"><Alert variant="danger">{error}</Alert></Container>;
    }

    return (
        <>
            <Helmet>
                <title>
                    {isEditMode ? t('admin.categories.form.editTitle', { name: formData.name_en || 'Category' }) : t('admin.categories.form.newTitle')}
                    {' | '}{t('adminPanel.title')}
                </title>
            </Helmet>
            <Container fluid className="p-4">
                <Row className="mb-3">
                    <Col>
                        <h2 className="admin-page-title">
                            {isEditMode ? t('admin.categories.form.editPageHeader', { name: formData.name_en || 'Category' }) : t('admin.categories.form.newPageHeader')}
                        </h2>
                    </Col>
                </Row>
                <Card className="shadow-sm">
                    <Card.Body>
                        {error && !loading && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3" controlId="name_en">
                                <Form.Label>{t('admin.categories.form.nameEnLabel')} <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="text" name="name_en" value={formData.name_en} onChange={handleChange} required />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="name_ar">
                                <Form.Label>{t('admin.categories.form.nameArLabel')} <span className="text-danger">*</span></Form.Label>
                                <Form.Control type="text" name="name_ar" value={formData.name_ar} onChange={handleChange} required dir="rtl" />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="categoryImage">
                                <Form.Label>{t('admin.categories.form.imageLabel', 'Category Image')}</Form.Label>
                                <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
                                {imagePreview && (
                                    <div className="mt-2">
                                        <img src={imagePreview} alt={t('admin.categories.form.imagePreviewAlt', 'Preview')} style={{ maxHeight: '150px', maxWidth: '100%', borderRadius: '0.25rem' }} />
                                        { (formData.imageUrl || imageFile) && ( // Show remove button if there's an existing or newly selected image
                                            <Button variant="outline-danger" size="sm" className="d-block mt-2" onClick={handleRemoveImage}>
                                                {t('admin.common.removeImageButton', 'Remove Image')}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </Form.Group>

                            {/* Add fields for description_en, description_ar if model expands */}

                            <Button variant="success" type="submit" disabled={loading || pageLoading}>
                                {loading ? <Spinner as="span" animation="border" size="sm" /> : (isEditMode ? t('admin.categories.form.saveChangesButton') : t('admin.categories.form.createCategoryButton'))}
                            </Button>
                            <Button variant="secondary" className="ms-2" onClick={() => navigate('/admin/categories')} disabled={loading || pageLoading}>
                                {t('admin.common.cancelButton')}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
};

export default CategoryFormPage;
