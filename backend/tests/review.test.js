const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');
const { errorHandler } = require('../middleware/errorHandler');

// Mock middleware
jest.mock('../middleware/authMiddleware', () => {
    const originalMock = require('./mocks/authMiddleware.mock');
    return {
        protect: originalMock.protect,
        authorize: originalMock.authorize,
    };
});
const authMiddlewareMockFuncs = require('./mocks/authMiddleware.mock');


// Setup Express app for testing
const app = express();
app.use(express.json());

// Mount review routes (can be top-level or nested for testing)
const reviewRoutes = require('../routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);
// For testing nested routes like /api/products/:productId/reviews
const productRoutes = require('../routes/productRoutes'); // productRoutes itself uses reviewRoutes internally
app.use('/api/products', productRoutes);

app.use(errorHandler);


describe('Review API Endpoints', () => {
    let testUser, testProduct;

    beforeEach(async () => {
        await Review.deleteMany({});
        await Product.deleteMany({});
        await User.deleteMany({});

        // Create a sample user
        testUser = await User.create({ // Save user to get a real _id
            username: 'reviewuser',
            email: 'review@example.com',
            password: 'password123', // Will be hashed
            role: 'customer'
        });

        // Create a sample product
        testProduct = await Product.create({
            name_en: 'Reviewable Product', name_ar: 'منتج قابل للمراجعة',
            description_en: 'Desc EN', description_ar: 'وصف عربي',
            price: 50, category: new mongoose.Types.ObjectId(), stock: 5,
        });

        // Default mock for protect to use this testUser
        authMiddlewareMockFuncs.protect.mockImplementation((req, res, next) => {
            req.user = {
                _id: testUser._id.toString(),
                id: testUser._id.toString(),
                username: testUser.username,
                role: testUser.role
            };
            next();
        });
    });

    const reviewData = {
        rating: 5,
        comment: 'This is a great product!',
        // productId will be from param or body
    };

    describe('POST /api/reviews (or /api/products/:productId/reviews)', () => {
        it('should add a review for a product (using top-level route)', async () => {
            const res = await request(app)
                .post('/api/reviews')
                .send({ ...reviewData, productId: testProduct._id.toString() });

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.rating).toBe(reviewData.rating);
            expect(res.body.data.comment).toBe(reviewData.comment);
            expect(res.body.data.user.toString()).toBe(testUser._id.toString());

            const productInDb = await Product.findById(testProduct._id);
            expect(productInDb.numReviews).toBe(1);
            expect(productInDb.averageRating).toBe(5);
        });

        it('should add a review for a product (using nested product route)', async () => {
            const res = await request(app)
                .post(`/api/products/${testProduct._id}/reviews`)
                .send(reviewData); // No need for productId in body here

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.rating).toBe(reviewData.rating);

            const productInDb = await Product.findById(testProduct._id);
            expect(productInDb.numReviews).toBe(1);
            expect(productInDb.averageRating).toBe(5);
        });

        it('should prevent a user from reviewing a product twice', async () => {
            await Review.create({
                ...reviewData,
                user: testUser._id,
                product: testProduct._id,
                username: testUser.username
            });

            const res = await request(app)
                .post('/api/reviews')
                .send({ ...reviewData, productId: testProduct._id.toString() });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBe('You have already reviewed this product.');
        });
    });

    describe('GET /api/reviews?productId=:productId (or /api/products/:productId/reviews)', () => {
        it('should get all reviews for a specific product (using query param)', async () => {
            await Review.create({ ...reviewData, user: testUser._id, product: testProduct._id, username: testUser.username });
            await Review.create({ ...reviewData, rating: 3, user: new mongoose.Types.ObjectId(), product: testProduct._id, username: 'anotheruser' });

            const res = await request(app).get(`/api/reviews?productId=${testProduct._id}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toBe(2);
            expect(res.body.data.length).toBe(2);
        });

        it('should get all reviews for a specific product (using nested route)', async () => {
            await Review.create({ ...reviewData, user: testUser._id, product: testProduct._id, username: testUser.username });
            const res = await request(app).get(`/api/products/${testProduct._id}/reviews`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.count).toBe(1);
        });
    });

    describe('DELETE /api/reviews/:reviewId', () => {
        it('should allow review owner to delete their review', async () => {
            const review = await Review.create({ ...reviewData, user: testUser._id, product: testProduct._id, username: testUser.username });

            const res = await request(app).delete(`/api/reviews/${review._id}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Review removed');

            const reviewInDb = await Review.findById(review._id);
            expect(reviewInDb).toBeNull();
            const productInDb = await Product.findById(testProduct._id);
            expect(productInDb.numReviews).toBe(0);
            expect(productInDb.averageRating).toBe(0);
        });

        it('should allow admin to delete any review', async () => {
            // Mock user as admin for this test
            authMiddlewareMockFuncs.protect.mockImplementationOnce((req, res, next) => {
                req.user = { ...authMiddlewareMockFuncs.mockUser, role: 'admin', _id: new mongoose.Types.ObjectId().toString() }; // Use a generic admin from mockUser base
                next();
            });
            const otherUserReview = await Review.create({ ...reviewData, user: new mongoose.Types.ObjectId(), product: testProduct._id, username: 'other' });

            const res = await request(app).delete(`/api/reviews/${otherUserReview._id}`);
            expect(res.statusCode).toEqual(200);
        });

        it('should prevent non-owner non-admin from deleting a review', async () => {
            const originalOwnerId = new mongoose.Types.ObjectId();
            const review = await Review.create({ ...reviewData, user: originalOwnerId, product: testProduct._id, username: 'originalowner' });

            // Current testUser (customer, not owner, not admin) tries to delete
            const res = await request(app).delete(`/api/reviews/${review._id}`);
            expect(res.statusCode).toEqual(403); // Forbidden
        });
    });

    describe('PUT /api/reviews/:reviewId', () => {
        it('should allow review owner to update their review', async () => {
            const review = await Review.create({ ...reviewData, user: testUser._id, product: testProduct._id, username: testUser.username });
            const updatedPayload = { rating: 3, comment: "Actually, it's just okay." };

            const res = await request(app)
                .put(`/api/reviews/${review._id}`)
                .send(updatedPayload);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.rating).toBe(3);
            expect(res.body.data.comment).toBe(updatedPayload.comment);

            const productInDb = await Product.findById(testProduct._id);
            expect(productInDb.averageRating).toBe(3); // Assuming only one review
        });

        it('should prevent non-owner from updating a review', async () => {
            const originalOwnerId = new mongoose.Types.ObjectId();
            const review = await Review.create({ ...reviewData, user: originalOwnerId, product: testProduct._id, username: 'originalowner' });
            const updatedPayload = { rating: 1 };

            // Current testUser (customer, not owner) tries to update
            const res = await request(app)
                .put(`/api/reviews/${review._id}`)
                .send(updatedPayload);
            expect(res.statusCode).toEqual(403);
        });
    });
});
