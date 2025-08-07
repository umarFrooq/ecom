const Product = require('../models/Product');
const Category = require('../models/Category'); // For validating category existence

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin (to be implemented)
exports.createProduct = async (req, res) => {
  try {
    const {
      name_en, name_ar, description_en, description_ar,
      price, category, stock, sku, tags_en, tags_ar, isActive
    } = req.body;

    // Basic validation
    if (!name_en || !name_ar || !description_en || !description_ar || !price || !category || stock === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields: name (en/ar), description (en/ar), price, category, stock.' });
    }

    // Validate category existence
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: `Category with ID ${category} not found.` });
    }

    // TODO: Image handling will be added later with S3 integration
    // For now, req.body.images might be an array of URLs or handled separately
    const images = req.body.images || [];


    const product = new Product({
      name_en, name_ar, description_en, description_ar,
      price, category, stock, sku, tags_en, tags_ar, isActive, images
    });

    const createdProduct = await product.save();
    res.status(201).json({ success: true, data: createdProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === 11000) { // Duplicate key error (e.g. slug or SKU)
        return res.status(400).json({ success: false, message: 'Product with this slug or SKU already exists.', error: error.keyValue });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all products (with filtering, pagination, sorting)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude from filtering (like pagination, sort, select, lang)
    // 'lang' is used for conditional logic (e.g., search fields) but not as a direct filter criterion on a 'lang' field.
    const removeFields = ['select', 'sort', 'page', 'limit', 'lang'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Base query - find active products
    let parsedQuery = JSON.parse(queryStr);
    parsedQuery.isActive = parsedQuery.isActive === undefined ? true : parsedQuery.isActive; // Default to active products

    // Language specific search (simple example, can be enhanced)
    // If a 'lang' query param is provided, we might prefer results in that language or search specific fields
    const lang = req.query.lang || 'en'; // Default to English

    // Search term for name/description/tags
    if (req.query.search) {
        const searchTerm = req.query.search;
        const searchRegex = new RegExp(searchTerm, 'i'); // Case-insensitive search

        if (lang === 'ar') {
            parsedQuery.$or = [
                { name_ar: searchRegex },
                { description_ar: searchRegex },
                { tags_ar: searchRegex }
            ];
        } else {
             parsedQuery.$or = [
                { name_en: searchRegex },
                { description_en: searchRegex },
                { tags_en: searchRegex }
            ];
        }
        delete parsedQuery.search; // remove from filter criteria as it's handled by $or
    }


    query = Product.find(parsedQuery).populate('category', 'name_en name_ar'); // Populate category name

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt'); // Default sort by newest
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Default 10 per page
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments(parsedQuery);

    query = query.skip(startIndex).limit(limit);

    const products = await query;

    // Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts: total,
      pagination,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get a single product by ID or Slug
// @route   GET /api/products/:identifier (ID or slug_en or slug_ar)
// @access  Public
exports.getProductByIdentifier = async (req, res) => {
  try {
    const identifier = req.params.identifier;
    let product;

    // Check if identifier is a valid MongoDB ObjectId
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findOne({ _id: identifier, isActive: true }).populate('category', 'name_en name_ar');
    }

    // If not found by ID, try by slug_en or slug_ar
    if (!product) {
      product = await Product.findOne({
        $or: [{ slug_en: identifier }, { slug_ar: identifier }],
        isActive: true
      }).populate('category', 'name_en name_ar');
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or not active.' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product:', error);
    if (error.kind === 'ObjectId' && !res.headersSent) { // Check if headersSent to avoid double response
        return res.status(404).json({ success: false, message: 'Product not found (invalid ID format).' });
    }
    if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
  }
};


const { deleteFileFromS3 } = require('../utils/s3Service'); // Import S3 service

// @desc    Update a product
// @route   PUT /api/products/:identifier
// @access  Private/Admin (or Editor)
exports.updateProduct = async (req, res) => {
  try {
    // Use req.params.identifier, assuming it's the product ID for updates
    let product = await Product.findById(req.params.identifier);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // TODO: Add proper authorization here to ensure only admin can update

    const oldImageUrls = [...product.images]; // Copy existing image URLs

    // Fields that can be updated
    const {
        name_en, name_ar, description_en, description_ar,
        price, category, stock, sku, tags_en, tags_ar, isActive, images // `images` is the new array of S3 URLs
    } = req.body;

    // Update product fields
    if (category) {
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(400).json({ success: false, message: `Category with ID ${category} not found.` });
        }
        product.category = category;
    }

    if (name_en !== undefined) product.name_en = name_en;
    if (name_ar !== undefined) product.name_ar = name_ar;
    if (description_en !== undefined) product.description_en = description_en;
    if (description_ar !== undefined) product.description_ar = description_ar;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (sku !== undefined) product.sku = sku;
    if (tags_en !== undefined) product.tags_en = tags_en;
    if (tags_ar !== undefined) product.tags_ar = tags_ar;
    if (isActive !== undefined) product.isActive = isActive;

    // Handle image updates and S3 deletions
    if (images !== undefined) { // `images` is the new array of S3 URLs from frontend
      product.images = images; // Set the new list of images

      // Determine which images were removed
      const imagesToDelete = oldImageUrls.filter(oldUrl => !images.includes(oldUrl));

      if (imagesToDelete.length > 0) {
        console.log('Deleting images from S3:', imagesToDelete);
        // Asynchronously delete images from S3
        Promise.all(imagesToDelete.map(url => deleteFileFromS3(url)))
          .then(() => console.log('Successfully deleted old images from S3.'))
          .catch(s3Error => console.error('Error deleting some old images from S3:', s3Error));
        // Note: We don't wait for S3 deletion to complete to respond to the user for faster UX.
        // Deletion failures are logged on the server. Consider a more robust queue/retry for critical deletions.
      }
    }

    // Slugs will be updated by pre-save middleware if names change
    // Check if names are actually changing before resetting slugs
    if (name_en !== undefined && name_en !== product.name_en) product.slug_en = undefined;
    if (name_ar !== undefined && name_ar !== product.name_ar) product.slug_ar = undefined;

    const updatedProduct = await product.save();
    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'Update failed. Product with this slug or SKU already exists.', error: error.keyValue });
    }
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ success: false, message: 'Product not found (invalid ID).' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:identifier
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    // Use req.params.identifier, assuming it's the product ID for deletions
    const product = await Product.findById(req.params.identifier);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // S3 Image Deletion Logic
    if (product.images && product.images.length > 0) {
      console.log('Deleting product images from S3:', product.images);
      // Asynchronously delete images from S3
      Promise.all(product.images.map(url => deleteFileFromS3(url)))
        .then(() => console.log(`Successfully deleted images for product ${product._id} from S3.`))
        .catch(s3Error => console.error(`Error deleting some images for product ${product._id} from S3:`, s3Error));
      // Note: We don't wait for S3 deletion to complete to respond to the user for faster UX.
      // Deletion failures are logged on the server.
    }

    await product.deleteOne();

    res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ success: false, message: 'Product not found (invalid ID).' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
