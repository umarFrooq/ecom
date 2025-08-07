const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Project = require('../models/Project'); // Adjust path as needed
const projectRoutes = require('../routes/projectRoutes'); // Adjust path
const { errorHandler } = require('../middleware/errorHandler'); // Adjust path

// Mock the actual middleware modules
// Mock middleware
jest.mock('../middleware/authMiddleware', () => {
    const originalMock = require('./mocks/authMiddleware.mock');
    return {
        protect: originalMock.protect,
        authorize: originalMock.authorize,
    };
});
jest.mock('../middleware/authOptionalMiddleware', () => {
    const originalMock = require('./mocks/authMiddleware.mock');
    return {
        protectOptional: originalMock.protectOptional,
    };
});
const authMiddlewareMockFuncs = require('./mocks/authMiddleware.mock'); // To control mock implementations


const app = express();
app.use(express.json());

// Mount the project routes. Ensure this is AFTER jest.mock calls.
const reloadedProjectRoutes = require('../routes/projectRoutes'); // Reload to use mocked middleware
app.use('/api/projects', reloadedProjectRoutes);
app.use(errorHandler);


describe('Project API Endpoints', () => {

  beforeEach(async () => {
    await Project.deleteMany({});
  });

  // Test data
  const projectDataEn = {
    title_en: 'Test Project EN',
    title_ar: 'مشروع اختبار عربي',
    description_en: 'English description for the test project.',
    description_ar: 'وصف عربي لمشروع الاختبار.',
    images: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg'],
    client_name_en: 'Test Client',
    client_name_ar: 'عميل اختبار',
    project_date: new Date('2023-01-15'),
    location_en: 'Test Location',
    location_ar: 'موقع اختبار',
    category_tags_en: ['Test', 'Sample'],
    category_tags_ar: ['اختبار', 'عينة'],
    isActive: true,
  };

  describe('POST /api/projects', () => {
    it('should create a new project when authenticated as admin/editor', async () => {
      // The mock for protect/authorize should allow this by default setting an admin user.
      const res = await request(app)
        .post('/api/projects')
        .send(projectDataEn);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title_en).toBe(projectDataEn.title_en);
      expect(res.body.data.slug_en).toBeDefined(); // Check if slug was generated

      const projectInDb = await Project.findById(res.body.data._id);
      expect(projectInDb).not.toBeNull();
      expect(projectInDb.title_en).toBe(projectDataEn.title_en);
    });

    it('should fail if required fields are missing', async () => {
      const incompleteData = { ...projectDataEn, title_en: undefined };
      const res = await request(app)
        .post('/api/projects')
        .send(incompleteData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Please provide title (EN/AR)');
    });
  });

  describe('GET /api/projects', () => {
    it('should return an empty array if no projects exist', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it('should return active projects by default for public access', async () => {
      await Project.create({...projectDataEn, isActive: true, title_en: 'Active Project'});
      await Project.create({...projectDataEn, isActive: false, title_en: 'Inactive Project'});

      // Mock protectOptional to simulate no user for this specific test call if needed
      // For now, our default protectOptional mock sets a user. To test public, we'd need to adjust.
      // Let's assume the controller logic for isActive=true is hit correctly.
      // To test the public path where req.user is null via protectOptional
      authMiddlewareMockFuncs.protectOptional.mockImplementationOnce((req, res, next) => {
        req.user = null;
        next();
      });

      const res = await request(app).get('/api/projects');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1); // Only active project should be returned
      expect(res.body.data[0].title_en).toBe('Active Project');

      // Reset mock for subsequent tests if needed, or ensure it's set per test.
      // Default mock sets a user, which is fine for testing admin views.
      authMiddlewareMockFuncs.protectOptional.mockImplementation(authMiddlewareMockFuncs.protectOptional); // Reset to default mock from file
    });

    // Add more tests for filtering, pagination, admin view etc.
  });

  describe('GET /api/projects/:identifier', () => {
    it('should get a project by its slug', async () => {
      const createdProject = await Project.create(projectDataEn);
      const res = await request(app).get(`/api/projects/${createdProject.slug_en}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title_en).toBe(projectDataEn.title_en);
    });

    it('should return 404 if project not found', async () => {
      const res = await request(app).get('/api/projects/non-existent-slug');
      expect(res.statusCode).toEqual(404);
    });
  });

  // Note: PUT and DELETE routes are on /:id/manage to avoid conflict with /:identifier for GET
  describe('PUT /api/projects/:id/manage', () => {
    it('should update a project', async () => {
      const project = await Project.create(projectDataEn);
      const updatedData = { title_en: 'Updated Project Title EN', isActive: false };

      const res = await request(app)
        .put(`/api/projects/${project._id}/manage`)
        .send(updatedData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title_en).toBe(updatedData.title_en);
      expect(res.body.data.isActive).toBe(false);

      const projectInDb = await Project.findById(project._id);
      expect(projectInDb.title_en).toBe(updatedData.title_en);
    });
  });

  describe('DELETE /api/projects/:id/manage', () => {
    it('should delete a project', async () => {
      const project = await Project.create(projectDataEn);

      const res = await request(app)
        .delete(`/api/projects/${project._id}/manage`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Project deleted successfully.');

      const projectInDb = await Project.findById(project._id);
      expect(projectInDb).toBeNull();
    });
  });

});
