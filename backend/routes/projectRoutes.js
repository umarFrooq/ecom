const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectByIdentifier,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { protectOptional } = require('../middleware/authOptionalMiddleware'); // For public routes that behave differently if logged in

// Public route to get projects (shows only active unless admin with query param)
// protectOptional will attach req.user if token is valid, otherwise req.user is null
router.route('/')
  .get(protectOptional, getProjects) // Public access, but admin can see more with ?status=all
  .post(protect, authorize('admin', 'editor'), createProject);

// Public route to get a single project by ID or Slug
// (shows only active unless admin)
router.route('/:identifier')
  .get(protectOptional, getProjectByIdentifier);

// Protected routes for updating and deleting (only by ID for simplicity here)
router.route('/:id/manage') // Using a sub-path to avoid conflict with slug identifier for general GET
  .put(protect, authorize('admin', 'editor'), updateProject)
  .delete(protect, authorize('admin'), deleteProject); // Typically only full admin deletes

module.exports = router;
