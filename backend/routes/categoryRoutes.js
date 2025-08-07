const express = require('express');
const router = express.Router();
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const multer = require('multer');
const { protect, authorize } = require('../middleware/authMiddleware');

// Configure multer for memory storage for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image file.'), false);
    }
  },
});

// Public routes
router.route('/')
  .get(getCategories)
  // Using protect and authorize middleware. Assuming 'admin' or 'editor' roles for create.
  // The .post(createCategory) was for testing; restoring proper auth.
  .post(protect, authorize('admin', 'editor'), upload.single('image'), createCategory);

router.route('/:id')
  .get(getCategoryById)
  .put(protect, authorize('admin', 'editor'), upload.single('image'), updateCategory) // Allow admin or editor to update
  .delete(protect, authorize('admin'), deleteCategory); // Only admin can delete

module.exports = router;
