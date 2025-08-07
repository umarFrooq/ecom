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

const ProjectSchema = new Schema(
  {
    title_en: {
      type: String,
      required: [true, 'English project title is required.'],
      trim: true,
      unique: true, // Assuming project titles should be unique
    },
    title_ar: {
      type: String,
      required: [true, 'Arabic project title is required.'],
      trim: true,
      unique: true, // Assuming project titles should be unique
    },
    description_en: {
      type: String,
      required: [true, 'English project description is required.'],
      trim: true,
    },
    description_ar: {
      type: String,
      required: [true, 'Arabic project description is required.'],
      trim: true,
    },
    images: [{ // Array of image URLs or objects with more details (e.g., alt text)
      type: String,
      required: true,
    }],
    client_name_en: { type: String, trim: true }, // Optional
    client_name_ar: { type: String, trim: true }, // Optional
    project_date: {
      type: Date,
      default: Date.now,
    },
    location_en: { type: String, trim: true }, // Optional
    location_ar: { type: String, trim: true }, // Optional
    category_tags_en: [{ type: String, trim: true }], // e.g., "Residential", "Commercial", "Office Fit-out"
    category_tags_ar: [{ type: String, trim: true }],
    slug_en: {
      type: String,
      unique: true,
      lowercase: true,
    },
    slug_ar: {
      type: String,
      unique: true,
      lowercase: true,
    },
    isActive: { // To allow hiding a project without deleting
      type: Boolean,
      default: true,
    },
    // Optional: link to the project if it's live or has a case study page
    // project_url: { type: String, trim: true },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Middleware to generate slugs before saving
ProjectSchema.pre('save', function(next) {
  if (this.isModified('title_en') || !this.slug_en) {
    this.slug_en = slugify(this.title_en) + '-' + Date.now(); // Add timestamp for uniqueness
  }
  if (this.isModified('title_ar') || !this.slug_ar) {
    let arabicSlug = this.title_ar
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF0-9a-z\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    this.slug_ar = arabicSlug + '-' + Date.now();
  }
  next();
});

// Indexing for frequently queried fields
ProjectSchema.index({ title_en: 'text', description_en: 'text', category_tags_en: 'text' });
ProjectSchema.index({ title_ar: 'text', description_ar: 'text', category_tags_ar: 'text' });
ProjectSchema.index({ isActive: 1, project_date: -1 });


module.exports = mongoose.model('Project', ProjectSchema);
