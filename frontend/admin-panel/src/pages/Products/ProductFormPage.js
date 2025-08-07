import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Form, Button, Spinner, Alert, Card, InputGroup } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import {
    getAdminProductById,
    createAdminProduct,
    updateAdminProduct,
    getAdminCategories, // To populate category dropdown
    uploadAdminImage // Service to upload image
} from '../../services/adminApiService';
// import './ProductFormPage.css'; // Optional

const ProductFormPage = () => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;
    const navigate = useNavigate();
    const { productId } = useParams(); // For editing existing product
    const isEditMode = Boolean(productId);

    // formData.images will store S3 URLs
    const initialFormData = {
        name_en: '', name_ar: '',
        description_en: '', description_ar: '',
        price: '', category: '', stock: '', sku: '',
        images: [], // Stores S3 URLs
        tags_en: '', tags_ar: '',
        isActive: true,
    };
    const [formData, setFormData] = useState(initialFormData);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false); // For form submission
    const [pageLoading, setPageLoading] = useState(isEditMode); // For fetching product/categories data
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // State for image uploads
    // imageUploads: tracks individual file upload status and previews
    // { id: tempId, file: File, preview: localUrl, status: 'pending' | 'uploading' | 'success' | 'error', s3Url: '', errorMsg: '' }
    const [imageUploads, setImageUploads] = useState([]);
    const fileInputRef = React.createRef();


    const fetchProductAndCategories = useCallback(async () => {
        setPageLoading(true);
        setError(null);
        try {
            const catResponse = await getAdminCategories();
            if (catResponse.data && catResponse.data.success) {
                setCategories(catResponse.data.data);
            } else {
                throw new Error(catResponse.data?.message || 'Failed to load categories');
            }

            if (isEditMode) {
                const prodResponse = await getAdminProductById(productId);
                if (prodResponse.data && prodResponse.data.success) {
                    const productData = prodResponse.data.data;
                    setFormData({
                        name_en: productData.name_en || '',
                        name_ar: productData.name_ar || '',
                        description_en: productData.description_en || '',
                        description_ar: productData.description_ar || '',
                        price: productData.price || '',
                        category: productData.category?._id || productData.category || '',
                        stock: productData.stock || 0,
                        sku: productData.sku || '',
                        images: productData.images || [], // Should be an array of S3 URLs
                        tags_en: productData.tags_en ? productData.tags_en.join(', ') : '',
                        tags_ar: productData.tags_ar ? productData.tags_ar.join(', ') : '',
                        isActive: productData.isActive !== undefined ? productData.isActive : true,
                    });
                    // Initialize imageUploads with existing S3 images
                    if (productData.images && productData.images.length > 0) {
                        setImageUploads(productData.images.map(url => ({
                            id: url, // Use URL as ID for existing S3 images
                            preview: url,
                            s3Url: url,
                            status: 'success', // Mark as successfully uploaded
                            file: null, // No local file for existing S3 images
                        })));
                    }
                } else {
                    throw new Error(prodResponse.data?.message || `Failed to load product ${productId}`);
                }
            }
        } catch (err) {
            setError(err.message || 'Error loading data for product form.');
            console.error("Error in form page load:", err);
        } finally {
            setPageLoading(false);
        }
    }, [isEditMode, productId]);

    useEffect(() => {
        fetchProductAndCategories();
    }, [fetchProductAndCategories]);

    // Cleanup object URLs
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
        event.target.value = null; // Reset file input

        const newUploads = files.map(file => ({
            id: `${file.name}-${Date.now()}`, // Temporary unique ID
            file: file,
            preview: URL.createObjectURL(file),
            status: 'pending',
            s3Url: '',
            errorMsg: '',
        }));

        setImageUploads(prev => [...prev, ...newUploads]);

        // Automatically start uploading
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
        // Revoke object URL if it's a local preview
        const uploadToRemove = imageUploads.find(u => u.id === idToRemove);
        if (uploadToRemove && uploadToRemove.preview && uploadToRemove.preview.startsWith('blob:')) {
            URL.revokeObjectURL(uploadToRemove.preview);
        }

        setImageUploads(prev => prev.filter(u => u.id !== idToRemove));

        if (s3UrlToRemove) { // If it was an S3 image (already uploaded or existing)
            setFormData(prev => ({ ...prev, images: prev.images.filter(url => url !== s3UrlToRemove) }));
        }
        // Note: Actual S3 deletion happens on the backend when the form is submitted with the updated list of images.
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if any images are still uploading
        const stillUploading = imageUploads.some(u => u.status === 'uploading');
        if (stillUploading) {
            setError(t('admin.products.form.errorImagesUploading', 'Some images are still uploading. Please wait.'));
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        // Ensure formData.images contains only S3 URLs from successful uploads
        const finalImageS3Urls = imageUploads
            .filter(u => u.status === 'success' && u.s3Url)
            .map(u => u.s3Url);

        const productPayload = {
            ...formData,
            images: finalImageS3Urls, // Use the filtered list of S3 URLs
            price: parseFloat(formData.price) || 0,
            stock: parseInt(formData.stock, 10) || 0,
            tags_en: formData.tags_en.split(',').map(tag => tag.trim()).filter(tag => tag),
            tags_ar: formData.tags_ar.split(',').map(tag => tag.trim()).filter(tag => tag),
        };
        if (!productPayload.category) delete productPayload.category; // Don't send empty category

        try {
            let response;
            if (isEditMode) {
                response = await updateAdminProduct(productId, productPayload);
            } else {
                response = await createAdminProduct(productPayload);
            }

            if (response.data && response.data.success) {
                setSuccess(isEditMode ? t('admin.products.form.updateSuccess') : t('admin.products.form.createSuccess'));
                setTimeout(() => navigate('/admin/products'), 2000); // Redirect after 2s
                if (!isEditMode) setFormData(initialFormData); // Clear form on create
            } else {
                throw new Error(response.data.message || (isEditMode ? t('admin.products.form.updateError') : t('admin.products.form.createError')));
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
    // Initial load error for product/categories
    if (error && !loading && isEditMode && !formData.name_en) { // Check if form data is not loaded due to error
         return <Container className="mt-3"><Alert variant="danger">{error}</Alert></Container>;
    }


    return (
        <>
            <Helmet>
                <title>
                    {isEditMode ? t('admin.products.form.editTitle', { name: formData.name_en || 'Product' }) : t('admin.products.form.newTitle')}
                    {' | '}{t('adminPanel.title')}
                </title>
            </Helmet>
            <Container fluid className="p-4">
                <Row className="mb-3">
                    <Col>
                        <h2 className="admin-page-title">
                            {isEditMode ? t('admin.products.form.editPageHeader', { name: formData.name_en || 'Product' }) : t('admin.products.form.newPageHeader')}
                        </h2>
                    </Col>
                </Row>
                <Card className="shadow-sm">
                    <Card.Body>
                        {error && !loading && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}
                        <Form onSubmit={handleSubmit}>
                            {/* Names */}
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="name_en">
                                        <Form.Label>{t('admin.products.form.nameEnLabel')} <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="text" name="name_en" value={formData.name_en} onChange={handleChange} required />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="name_ar">
                                        <Form.Label>{t('admin.products.form.nameArLabel')} <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="text" name="name_ar" value={formData.name_ar} onChange={handleChange} required dir="rtl" />
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* Descriptions */}
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="description_en">
                                        <Form.Label>{t('admin.products.form.descriptionEnLabel')} <span className="text-danger">*</span></Form.Label>
                                        <Form.Control as="textarea" rows={4} name="description_en" value={formData.description_en} onChange={handleChange} required />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="description_ar">
                                        <Form.Label>{t('admin.products.form.descriptionArLabel')} <span className="text-danger">*</span></Form.Label>
                                        <Form.Control as="textarea" rows={4} name="description_ar" value={formData.description_ar} onChange={handleChange} required dir="rtl" />
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* Price, Category, Stock, SKU */}
                            <Row>
                                <Col md={3}>
                                    <Form.Group className="mb-3" controlId="price">
                                        <Form.Label>{t('admin.products.form.priceLabel')} <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3" controlId="category">
                                        <Form.Label>{t('admin.products.form.categoryLabel')} <span className="text-danger">*</span></Form.Label>
                                        <Form.Select name="category" value={formData.category} onChange={handleChange} required>
                                            <option value="">{t('admin.products.form.selectCategory')}</option>
                                            {categories.map(cat => (
                                                <option key={cat._id} value={cat._id}>
                                                    {currentLang === 'ar' && cat.name_ar ? cat.name_ar : cat.name_en}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3" controlId="stock">
                                        <Form.Label>{t('admin.products.form.stockLabel')} <span className="text-danger">*</span></Form.Label>
                                        <Form.Control type="number" name="stock" value={formData.stock} onChange={handleChange} required min="0" />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3" controlId="sku">
                                        <Form.Label>{t('admin.products.form.skuLabel')}</Form.Label>
                                        <Form.Control type="text" name="sku" value={formData.sku} onChange={handleChange} />
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* Images */}
                            <Form.Group className="mb-3">
                                <Form.Label>{t('admin.products.form.imagesLabel')}</Form.Label>
                                <div className="mb-2">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                    >
                                        {t('admin.products.form.selectImagesButton', 'Select Images...')}
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
                                                    title={upload.errorMsg || t('admin.products.form.uploadErrorTooltip', 'An unknown error occurred during upload.')}
                                                    style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                >
                                                    {upload.errorMsg ? (upload.errorMsg.length > 15 ? upload.errorMsg.substring(0, 12) + '...' : upload.errorMsg) : t('admin.products.form.uploadErrorShort', 'Error')}
                                                </Card.Text>
                                            )}
                                             {upload.status !== 'uploading' && (
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    className="position-absolute top-0 end-0 m-1 p-1 lh-1"
                                                    onClick={() => removeImage(upload.id, upload.s3Url)}
                                                    title={t('admin.products.form.removeImageButton', 'Remove image')}
                                                >
                                                    &times;
                                                </Button>
                                             )}
                                        </Card>
                                    ))}
                                </div>
                                <Form.Text className="d-block">
                                    {t('admin.products.form.imagesS3Tip', 'Upload images directly. They will be saved to S3.')}
                                </Form.Text>
                            </Form.Group>

                            {/* Tags */}
                             <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="tags_en">
                                        <Form.Label>{t('admin.products.form.tagsEnLabel')}</Form.Label>
                                        <Form.Control type="text" name="tags_en" value={formData.tags_en} onChange={handleChange} />
                                        <Form.Text>{t('admin.products.form.tagsTip')}</Form.Text>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="tags_ar">
                                        <Form.Label>{t('admin.products.form.tagsArLabel')}</Form.Label>
                                        <Form.Control type="text" name="tags_ar" value={formData.tags_ar} onChange={handleChange} dir="rtl" />
                                         <Form.Text>{t('admin.products.form.tagsTip')}</Form.Text>
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* Is Active */}
                            <Form.Group className="mb-4" controlId="isActive">
                                <Form.Check
                                    type="switch"
                                    name="isActive"
                                    label={t('admin.products.form.isActiveLabel')}
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                />
                            </Form.Group>

                            <Button variant="success" type="submit" disabled={loading || pageLoading}>
                                {loading ? <Spinner as="span" animation="border" size="sm" /> : (isEditMode ? t('admin.products.form.saveChangesButton') : t('admin.products.form.createProductButton'))}
                            </Button>
                            <Button variant="secondary" className="ms-2" onClick={() => navigate('/admin/products')} disabled={loading || pageLoading}>
                                {t('admin.common.cancelButton')}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
};

export default ProductFormPage;
