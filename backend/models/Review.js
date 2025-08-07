const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema(
  {
    user: { // Customer who wrote the review
      type: Schema.Types.ObjectId,
      ref: 'User', // Assuming customers will also be Users with a 'customer' role
      required: [true, 'User is required for a review.'],
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required for a review.'],
    },
    username: { type: String, required: true }, // Store username at time of review for display
    rating: {
      type: Number,
      required: [true, 'Rating is required.'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot be more than 1000 characters.']
      // required: [true, 'Comment is required.'], // Making comment optional
    },
    // Optional: admin can approve reviews before they are public
    // isApproved: { type: Boolean, default: false }
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Prevent user from submitting more than one review per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to calculate average rating for a product
ReviewSchema.statics.calculateAverageRating = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: '$product',
        numReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  try {
    if (stats.length > 0) {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        averageRating: stats[0].averageRating.toFixed(1), // Round to one decimal place
        numReviews: stats[0].numReviews,
      });
    } else {
      // No reviews, reset to default values
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        averageRating: 0,
        numReviews: 0,
      });
    }
  } catch (err) {
    console.error('Error updating product average rating:', err);
  }
};

// Call calculateAverageRating after save
ReviewSchema.post('save', async function () {
  // `this.constructor` refers to the current model (Review)
  // `this.product` refers to the product field of the saved review document
  await this.constructor.calculateAverageRating(this.product);
});

// Call calculateAverageRating before remove (or deleteOne, deleteMany)
// Note: For findByIdAndRemove or findByIdAndDelete, this pre hook won't fire on the document.
// It fires on the query. So, if you use those, you'd need to manually call calculateAverageRating.
// Or, ensure you always fetch the document first, then call .remove() on the document.
ReviewSchema.post('deleteOne', { document: true, query: false }, async function () {
    // `this` is the document being removed
    if (this.product) {
        await this.constructor.calculateAverageRating(this.product);
    }
});
// If using findOneAndX type queries for deletion, this might be more complex.
// A simpler way if direct doc.remove() isn't always used:
// Have a separate function that can be called from the controller after deletion, passing productId.


module.exports = mongoose.model('Review', ReviewSchema);
