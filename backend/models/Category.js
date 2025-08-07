const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name_en: {
    type: String,
    required: [true, 'English name is required.'],
    trim: true,
    unique: true,
  },
  name_ar: {
    type: String,
    required: [true, 'Arabic name is required.'],
    trim: true,
    unique: true,
  },
  // Optional: Add a slug for SEO friendly URLs if categories will have their own pages
  // slug_en: { type: String, unique: true, lowercase: true },
  // slug_ar: { type: String, unique: true, lowercase: true },
  // Optional: Add a description
  // description_en: { type: String, trim: true },
  // description_ar: { type: String, trim: true },
  imageUrl: {
    type: String,
    trim: true, // Store the URL of the category image
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Middleware to generate slugs (if you decide to use them)
// CategorySchema.pre('save', function(next) {
//   if (this.isModified('name_en')) {
//     this.slug_en = this.name_en.toLowerCase().split(' ').join('-');
//   }
//   if (this.isModified('name_ar')) {
//     // A more robust slugify function would be needed for Arabic, handling special characters
//     this.slug_ar = this.name_ar.toLowerCase().split(' ').join('-').replace(/[^\w\u0600-\u06FF-]/g, '');
//   }
//   next();
// });

module.exports = mongoose.model('Category', CategorySchema);
