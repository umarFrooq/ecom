const Category = require('../models/Category');
const { uploadFileToS3, deleteFileFromS3 } = require('../utils/s3Service');

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private/Admin (to be implemented)
exports.createCategory = async (req, res) => {
  try {
    const { name_en, name_ar } = req.body;

    if (!name_en || !name_ar) {
      return res.status(400).json({ success: false, message: 'English and Arabic names are required.' });
    }

    // Check if category already exists
    let category = await Category.findOne({ $or: [{ name_en }, { name_ar }] });
    if (category) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists.' });
    }

    let imageUrl;
    if (req.file) {
      try {
        imageUrl = await uploadFileToS3(req.file, 'categories');
      } catch (s3Error) {
        console.error('S3 Upload Error in createCategory:', s3Error);
        // It's debatable whether to fail the whole category creation if S3 upload fails.
        // For now, let's return an error.
        return res.status(500).json({ success: false, message: 'Failed to upload category image to S3.', error: s3Error.message });
      }
    }

    category = new Category({
      name_en,
      name_ar,
      imageUrl, // This will be undefined if no file was uploaded, which is fine
    });
    await category.save();

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('Error creating category:', error);
    // If an image was uploaded but category save failed, we might have an orphaned S3 file.
    // Consider adding logic to delete from S3 if imageUrl is set and save fails.
    // However, this can get complex (e.g. if DB error is for duplicate name, image might be for a legit new attempt).
    // For now, keeping it simple. Advanced error handling can be added.
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name_en: 1 }); // Sort by English name
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get a single category by ID
// @route   GET /api/categories/:id
// @access  Public
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    console.error('Error fetching category by ID:', error);
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ success: false, message: 'Category not found (invalid ID).' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin (to be implemented)
exports.updateCategory = async (req, res) => {
  try {
    const { name_en, name_ar } = req.body;
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Check for duplicate names if names are being changed
    if (name_en && name_en !== category.name_en) {
      const existing = await Category.findOne({ name_en });
      if (existing && existing._id.toString() !== req.params.id) {
        return res.status(400).json({ success: false, message: `Category with English name '${name_en}' already exists.` });
      }
      category.name_en = name_en;
    }
    if (name_ar && name_ar !== category.name_ar) {
      const existing = await Category.findOne({ name_ar });
      if (existing && existing._id.toString() !== req.params.id) {
        return res.status(400).json({ success: false, message: `Category with Arabic name '${name_ar}' already exists.` });
      }
      category.name_ar = name_ar;
    }

    // Only update fields that were actually passed
    // Names are handled above with duplicate checks.
    // if (req.body.name_en) category.name_en = req.body.name_en; // Already handled
    // if (req.body.name_ar) category.name_ar = req.body.name_ar; // Already handled

    if (req.file) {
      // If a new file is uploaded, replace the old one
      const oldImageUrl = category.imageUrl;

      try {
        category.imageUrl = await uploadFileToS3(req.file, 'categories');
        // If upload is successful and there was an old image, delete it
        if (oldImageUrl) {
          // Intentionally not awaiting deleteFileFromS3 to avoid delaying response.
          // Deletion failure will be logged by s3Service.
          deleteFileFromS3(oldImageUrl).catch(s3DeleteError => {
            console.error('Error deleting old category image from S3:', s3DeleteError);
          });
        }
      } catch (s3Error) {
        console.error('S3 Upload Error in updateCategory:', s3Error);
        return res.status(500).json({ success: false, message: 'Failed to upload new category image to S3.', error: s3Error.message });
      }
    } else if (req.body.removeImage === 'true' && category.imageUrl) {
      // Handle explicit image removal if a field like 'removeImage=true' is sent
      const oldImageUrl = category.imageUrl;
      category.imageUrl = undefined; // Or null
      if (oldImageUrl) {
        deleteFileFromS3(oldImageUrl).catch(s3DeleteError => {
          console.error('Error deleting category image from S3 during removal:', s3DeleteError);
        });
      }
    }


    const updatedCategory = await category.save();
    res.status(200).json({ success: true, data: updatedCategory });
  } catch (error) {
    console.error('Error updating category:', error);
    // Orphaned file handling consideration: if new image was uploaded, but save fails,
    // the new image is on S3. This is complex to handle transactionally without two-phase commits.
     if (error.kind === 'ObjectId') {
        return res.status(404).json({ success: false, message: 'Category not found (invalid ID).' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin (to be implemented)
// Note: Consider implications: What happens to products in this category?
// Option 1: Disallow deletion if products exist.
// Option 2: Set category to null/default for products.
// Option 3: Delete products (cascade - dangerous).
// For now, simple deletion. Add product check later if needed.
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // TODO: Add check here: if there are products associated with this category, prevent deletion or handle accordingly.
    // const productsInCategory = await Product.countDocuments({ category: req.params.id });
    // if (productsInCategory > 0) {
    //   return res.status(400).json({ success: false, message: 'Cannot delete category. It has associated products.' });
    // }

    const imageUrlToDelete = category.imageUrl;

    await category.deleteOne(); // Changed from .remove() which is deprecated

    if (imageUrlToDelete) {
      // Intentionally not awaiting deleteFileFromS3 to avoid delaying response.
      // Deletion failure will be logged by s3Service.
      deleteFileFromS3(imageUrlToDelete).catch(s3DeleteError => {
        console.error('Error deleting category image from S3 during category deletion:', s3DeleteError);
      });
    }

    res.status(200).json({ success: true, message: 'Category deleted successfully.' });
  } catch (error)
 {
    console.error('Error deleting category:', error);
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ success: false, message: 'Category not found (invalid ID).' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
