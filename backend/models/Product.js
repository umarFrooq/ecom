const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Function to generate a basic slug (can be improved)
const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

const ProductSchema = new Schema({
  name_en: {
    type: String,
    required: [true, 'English product name is required.'],
    trim: true,
  },
  name_ar: {
    type: String,
    required: [true, 'Arabic product name is required.'],
    trim: true,
  },
  description_en: {
    type: String,
    required: [true, 'English product description is required.'],
    trim: true,
  },
  description_ar: {
    type: String,
    required: [true, 'Arabic product description is required.'],
    trim: true,
  },
  images: [{ // Array of image URLs
    type: String,
    // required: true, // An empty array could mean no images yet, but usually at least one is good
  }],
  price: {
    type: Number,
    required: [true, 'Product price is required.'],
    min: [0, 'Price cannot be negative.'],
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required.'],
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required.'],
    min: [0, 'Stock cannot be negative.'],
    default: 0,
  },
  sku: { // Stock Keeping Unit
    type: String,
    trim: true,
    // unique: true, // Consider if SKU must be unique or if it's optional
    // sparse: true, // If unique and optional, use sparse index
  },
  tags_en: [{ type: String, trim: true }],
  tags_ar: [{ type: String, trim: true }],
  slug_en: {
    type: String,
    unique: true,
    lowercase: true,
  },
  slug_ar: {
    type: String,
    unique: true,
    lowercase: true, // Note: Arabic script doesn't have case, but good for consistency
  },
  isActive: { // To allow soft delete or temporarily disable product visibility
    type: Boolean,
    default: true,
  },
  averageRating: {
    type: Number,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0,
  },
  numReviews: {
    type: Number,
    default: 0,
  },
  // Optional: Dimensions, weight for shipping
  // weight: { type: Number },
  // dimensions: {
  //   length: { type: Number },
  //   width: { type: Number },
  //   height: { type: Number },
  // },
  // Optional: Manufacturer/Brand
  // brand_en: { type: String },
  // brand_ar: { type: String },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Middleware to generate slugs before saving
ProductSchema.pre('save', function(next) {
  if (this.isModified('name_en') || !this.slug_en) {
    this.slug_en = slugify(this.name_en) + '-' + Date.now(); // Add timestamp for uniqueness
  }
  if (this.isModified('name_ar') || !this.slug_ar) {
    // A more robust slugify function might be needed for Arabic
    // This is a basic attempt. Consider libraries like 'arabic-slugify' or build a more comprehensive one.
    let arabicSlug = this.name_ar
        .toString()
        .toLowerCase() // May not be relevant for Arabic but for consistency
        .replace(/\s+/g, '-')
        // Keep Arabic characters and hyphens, remove others
        .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF0-9a-z\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    this.slug_ar = arabicSlug + '-' + Date.now(); // Add timestamp for uniqueness
  }
  next();
});

// Indexing for frequently queried fields
ProductSchema.index({ name_en: 'text', description_en: 'text', tags_en: 'text' }); // For English search
ProductSchema.index({ name_ar: 'text', description_ar: 'text', tags_ar: 'text' }); // For Arabic search
ProductSchema.index({ price: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ sku: 1 }, { unique: true, sparse: true }); // Sparse index for optional unique SKU

module.exports = mongoose.model('Product', ProductSchema);
