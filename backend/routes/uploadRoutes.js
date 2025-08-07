const express = require('express');
const multer = require('multer');
const { uploadFileToS3 } = require('../utils/s3Service.js');
const { protect, admin } = require('../middleware/authMiddleware.js'); // Assuming admin-only uploads

const router = express.Router();

// Configure multer for memory storage
// This is suitable for passing the file buffer directly to S3.
// Adjust limits as necessary.
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    // Basic image type filtering
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image file.'), false);
    }
  },
});

// @desc    Upload an image to S3
// @route   POST /api/v1/upload/image
// @access  Private/Admin
router.post(
  '/image',
  protect, // User must be authenticated
  admin,   // User must be an admin
  upload.single('image'), // 'image' is the field name in the form-data
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided.' });
      }

      const fileUrl = await uploadFileToS3(req.file);
      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully.',
        data: { imageUrl: fileUrl },
      });
    } catch (error) {
      console.error('Image upload error:', error);
      // Multer error (e.g., file too large, wrong type)
      if (error instanceof multer.MulterError) {
          return res.status(400).json({ success: false, message: error.message });
      }
      // Custom error from s3Service or fileFilter
      if (error.message.startsWith('Not an image!') || error.message.startsWith('S3_BUCKET_NAME') || error.message.startsWith('Invalid file object') || error.message.startsWith('Failed to upload file to S3')) {
          return res.status(400).json({ success: false, message: error.message });
      }
      // Generic server error
      res.status(500).json({ success: false, message: 'Server error during image upload.' });
    }
  }
);

module.exports = router;
