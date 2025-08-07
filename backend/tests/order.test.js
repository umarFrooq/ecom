const request = require('supertest');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User'); // Needed for creating test users
const Product = require('../models/Product'); // Needed for order items
const app = require('../server'); // Import the main app

// Mock middleware
jest.mock('../middleware/authMiddleware', () => {
    const originalMock = require('./mocks/authMiddleware.mock');
    return {
        protect: originalMock.protect,
        authorize: originalMock.authorize,
    };
});
const authMiddlewareMockFuncs = require('./mocks/authMiddleware.mock');

describe('Order API Endpoints', () => {
    let testUser, testProduct, testOrderData, authToken;

    beforeEach(async () => {
        await Order.deleteMany({});
        await User.deleteMany({});
        await Product.deleteMany({});

        testUser = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            role: 'customer'
        });

        testProduct = await Product.create({
            name_en: 'Testable Product', name_ar: 'منتج قابل للاختبار',
            description_en: 'Desc EN', description_ar: 'وصف عربي',
            price: 100, category: new mongoose.Types.ObjectId(), stock: 10,
        });

        testOrderData = {
            orderItems: [{
                product: testProduct._id,
                name_en: testProduct.name_en,
                name_ar: testProduct.name_ar,
                quantity: 1,
                price: testProduct.price,
                image: 'test_image.jpg',
            }],
            shippingAddress: {
                address: '123 Test St', city: 'Testville',
                postalCode: '12345', country: 'Testland',
            },
            paymentMethod: 'Credit Card',
            itemsPrice: testProduct.price * 1,
            taxPrice: 0,
            shippingPrice: 10,
            totalPrice: (testProduct.price * 1) + 10,
        };
    });

    describe('POST /api/orders', () => {
        it('should create an order for an authenticated customer', async () => {
            authMiddlewareMockFuncs.protect.mockImplementationOnce((req, res, next) => {
                req.user = testUser;
                next();
            });

            const res = await request(app)
                .post('/api/orders')
                .send(testOrderData);

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.orderId).toBeDefined();
        });
    });
});
