const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const { errorHandler } = require('../middleware/errorHandler');

// Mock middleware
jest.mock('../middleware/authMiddleware', () => {
    const originalMock = require('./mocks/authMiddleware.mock');
    return {
        protect: originalMock.protect,
        authorize: originalMock.authorize, // authorize mock allows any role by default
    };
});
const authMiddlewareMockFuncs = require('./mocks/authMiddleware.mock');


// Setup Express app
const app = express();
app.use(express.json());
const cartRoutes = require('../routes/cartRoutes');
app.use('/api/cart', cartRoutes);
app.use(errorHandler);

describe('Cart API Endpoints', () => {
    let testUser, testProduct1, testProduct2, mockUserId;

    beforeEach(async () => {
        await User.deleteMany({});
        await Product.deleteMany({});

        mockUserId = new mongoose.Types.ObjectId().toString();

        // Default mock for protect to use this testUser's ID and 'customer' role
        authMiddlewareMockFuncs.protect.mockImplementation((req, res, next) => {
            req.user = {
                _id: mockUserId,
                id: mockUserId,
                username: 'cartuser',
                role: 'customer' // Ensure user has 'customer' role for cart operations
            };
            next();
        });

        // Create the user in DB that matches mockUserId for cart operations
        testUser = await User.create({
            _id: mockUserId,
            username: 'cartuser',
            email: 'cart@example.com',
            password: 'password123',
            role: 'customer',
            cart: []
        });

        testProduct1 = await Product.create({
            name_en: 'Cart Product 1', name_ar: 'منتج سلة ١',
            description_en: 'Desc 1', description_ar: 'وصف ١',
            price: 100, category: new mongoose.Types.ObjectId(), stock: 10,
        });
        testProduct2 = await Product.create({
            name_en: 'Cart Product 2', name_ar: 'منتج سلة ٢',
            description_en: 'Desc 2', description_ar: 'وصف ٢',
            price: 200, category: new mongoose.Types.ObjectId(), stock: 5,
        });
    });

    describe('GET /api/cart', () => {
        it('should get an empty cart for a new user', async () => {
            const res = await request(app).get('/api/cart');
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.data.length).toBe(0);
        });
    });

    describe('POST /api/cart', () => {
        it('should add an item to the cart', async () => {
            const res = await request(app)
                .post('/api/cart')
                .send({ productId: testProduct1._id.toString(), quantity: 1 });

            expect(res.statusCode).toEqual(200); // Controller returns 200 on add/update
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].product._id.toString()).toBe(testProduct1._id.toString());
            expect(res.body.data[0].quantity).toBe(1);

            const userInDb = await User.findById(testUser._id);
            expect(userInDb.cart.length).toBe(1);
            expect(userInDb.cart[0].product.toString()).toBe(testProduct1._id.toString());
        });

        it('should update quantity if item already in cart', async () => {
            await request(app) // Add item first
                .post('/api/cart')
                .send({ productId: testProduct1._id.toString(), quantity: 1 });

            const res = await request(app) // Add same item again
                .post('/api/cart')
                .send({ productId: testProduct1._id.toString(), quantity: 2 });

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].quantity).toBe(3); // 1 + 2
        });

        it('should fail to add item if stock is insufficient', async () => {
            const res = await request(app)
                .post('/api/cart')
                .send({ productId: testProduct1._id.toString(), quantity: testProduct1.stock + 1 });
            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBe('Not enough product in stock');
        });
    });

    describe('PUT /api/cart/item/:productId', () => {
        it('should update an item quantity in the cart', async () => {
            await User.findByIdAndUpdate(testUser._id, { cart: [{ product: testProduct1._id, quantity: 1 }] });

            const res = await request(app)
                .put(`/api/cart/item/${testProduct1._id}`)
                .send({ quantity: 5 });

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].quantity).toBe(5);
        });

        it('should remove item if quantity is 0', async () => {
            await User.findByIdAndUpdate(testUser._id, { cart: [{ product: testProduct1._id, quantity: 1 }] });
            const res = await request(app)
                .put(`/api/cart/item/${testProduct1._id}`)
                .send({ quantity: 0 });

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.length).toBe(0);
        });
    });

    describe('DELETE /api/cart/item/:productId', () => {
        it('should remove an item from the cart', async () => {
            await User.findByIdAndUpdate(testUser._id, {
                cart: [
                    { product: testProduct1._id, quantity: 1 },
                    { product: testProduct2._id, quantity: 1 }
                ]
            });

            const res = await request(app).delete(`/api/cart/item/${testProduct1._id}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].product._id.toString()).toBe(testProduct2._id.toString());
        });
    });

    describe('DELETE /api/cart', () => {
        it('should clear the entire cart', async () => {
            await User.findByIdAndUpdate(testUser._id, {
                cart: [
                    { product: testProduct1._id, quantity: 1 },
                    { product: testProduct2._id, quantity: 1 }
                ]
            });
            const res = await request(app).delete('/api/cart');
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Cart cleared successfully');
            expect(res.body.data.length).toBe(0);

            const userInDb = await User.findById(testUser._id);
            expect(userInDb.cart.length).toBe(0);
        });
    });
});
