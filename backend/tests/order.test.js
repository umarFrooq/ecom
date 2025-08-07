const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User'); // Needed for creating test users
const Product = require('../models/Product'); // Needed for order items
const { errorHandler } = require('../middleware/errorHandler');

// Mock middleware
// Correct way to mock, ensuring the factory function doesn't reference out-of-scope vars incorrectly.
jest.mock('../middleware/authMiddleware', () => {
    const originalMock = require('./mocks/authMiddleware.mock'); // Require inside factory
    return {
        protect: originalMock.protect,
        authorize: originalMock.authorize,
    };
});
// We'll need to import the mock functions themselves if we want to manipulate them (e.g. mockImplementationOnce)
const authMiddlewareMockFuncs = require('./mocks/authMiddleware.mock');


// Setup Express app for testing
const app = express();
app.use(express.json());
const orderRoutes = require('../routes/orderRoutes'); // Import after mocks
app.use('/api/orders', orderRoutes);
app.use(errorHandler);

describe('Order API Endpoints', () => {
    let testUser, testProduct, testOrderData, authToken;

    beforeAll(async () => {
        // Create a test user (customer)
        // Note: In a real setup, password hashing would occur.
        // For controller tests where auth is mocked, we mainly need the user ID and role.
        // The mockUser from authMiddleware.mock.js will be used by default by the mocked 'protect'.
        // We can customize mockUser role if needed for specific tests.
        // No need to create JWT here as 'protect' mock directly sets req.user.
    });

    beforeEach(async () => {
        await Order.deleteMany({});
        await User.deleteMany({});
        await Product.deleteMany({});

        // Create a sample user for orders (if specific user needed beyond default mock)
        // For most tests here, the default mockUser (admin) from the mock file will be used by the mocked 'protect'.
        // If a 'customer' role is needed specifically for a test, we use mockImplementationOnce on the imported mock function:
        // authMiddlewareMockFuncs.protect.mockImplementationOnce((req, res, next) => {
        //   req.user = { ...authMiddlewareMockFuncs.mockUser, role: 'customer', _id: new mongoose.Types.ObjectId().toString() };
        //   next();
        // });

        // Create a sample product
        testProduct = await Product.create({
            name_en: 'Testable Product', name_ar: 'منتج قابل للاختبار',
            description_en: 'Desc EN', description_ar: 'وصف عربي',
            price: 100, category: new mongoose.Types.ObjectId(), stock: 10,
            // Slugs will auto-generate
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
            // Ensure the mocked user has 'customer' or 'admin' role as per authorize in route
            authMiddlewareMock.protect.mockImplementationOnce((req, res, next) => {
                req.user = { ...authMiddlewareMock.mockUser, role: 'customer', _id: new mongoose.Types.ObjectId().toString() };
                next();
            });

            const res = await request(app)
                .post('/api/orders')
                .send(testOrderData);

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.orderItems.length).toBe(1);
            expect(res.body.data.orderItems[0].product.toString()).toBe(testProduct._id.toString());
            expect(res.body.data.totalPrice).toBe(testOrderData.totalPrice);

            const orderInDb = await Order.findById(res.body.data._id);
            expect(orderInDb).not.toBeNull();
            expect(orderInDb.paymentMethod).toBe('Credit Card');

            // Check stock was decremented
            const productInDb = await Product.findById(testProduct._id);
            expect(productInDb.stock).toBe(9); // Initial stock was 10, ordered 1

            // Check user cart was cleared
            const userInDb = await User.findById(testUser._id); // Use the specific testUser created for this test block
            expect(userInDb.cart.length).toBe(0);
        });

        it('should fail if stock is insufficient during order creation', async () => {
            authMiddlewareMockFuncs.protect.mockImplementationOnce((req, res, next) => {
                req.user = { ...authMiddlewareMockFuncs.mockUser, role: 'customer', _id: testUser._id.toString() };
                next();
            });
            const orderDataWithHighQuantity = {
                ...testOrderData,
                orderItems: [{ ...testOrderData.orderItems[0], quantity: testProduct.stock + 1 }]
            };
            const res = await request(app)
                .post('/api/orders')
                .send(orderDataWithHighQuantity);

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain('Not enough stock');
        });


        it('should fail if no order items are provided', async () => {
             authMiddlewareMock.protect.mockImplementationOnce((req, res, next) => { // Customer role
                req.user = { ...authMiddlewareMock.mockUser, role: 'customer', _id: new mongoose.Types.ObjectId().toString() };
                next();
            });
            const res = await request(app)
                .post('/api/orders')
                .send({ ...testOrderData, orderItems: [] });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBe('No order items');
        });
    });

    describe('GET /api/orders/:id', () => {
        it('should get an order by ID for the order owner', async () => {
            const customerId = testUser._id.toString(); // Use the created testUser's ID
            authMiddlewareMockFuncs.protect.mockImplementationOnce((req, res, next) => {
                req.user = { ...authMiddlewareMockFuncs.mockUser, role: 'customer', _id: customerId, id: customerId };
                next();
            });

            const createdOrder = await Order.create({ ...testOrderData, user: customerId });

            const res = await request(app).get(`/api/orders/${createdOrder._id}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data._id.toString()).toBe(createdOrder._id.toString());
            expect(res.body.data.user._id.toString()).toBe(customerId);
        });

        it('should allow admin to get any order by ID', async () => {
            authMiddlewareMockFuncs.protect.mockImplementationOnce((req, res, next) => {
                 req.user = { ...authMiddlewareMockFuncs.mockUser, role: 'admin', _id: new mongoose.Types.ObjectId().toString() };
                 next();
            });

            const otherUserOrder = await Order.create({ ...testOrderData, user: new mongoose.Types.ObjectId() });
            const res = await request(app).get(`/api/orders/${otherUserOrder._id}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data._id.toString()).toBe(otherUserOrder._id.toString());
        });

        it('should return 403 if a customer tries to access another user order', async () => {
            const attackerUserId = new mongoose.Types.ObjectId().toString();
            authMiddlewareMockFuncs.protect.mockImplementationOnce((req, res, next) => {
                req.user = { ...authMiddlewareMockFuncs.mockUser, role: 'customer', _id: attackerUserId };
                next();
            });
            const otherUserOrder = await Order.create({ ...testOrderData, user: testUser._id }); // Order belongs to testUser
            const res = await request(app).get(`/api/orders/${otherUserOrder._id}`);
            expect(res.statusCode).toEqual(403);
        });
    });

    describe('PUT /api/orders/:id/pay', () => {
        it('should update order to paid', async () => {
            authMiddlewareMockFuncs.protect.mockImplementationOnce((req, res, next) => {
                req.user = { ...authMiddlewareMockFuncs.mockUser, email: testUser.email, role: 'customer', _id: testUser._id.toString(), id: testUser._id.toString() };
                next();
            });
            const order = await Order.create({ ...testOrderData, user: testUser._id });

            const res = await request(app)
                .put(`/api/orders/${order._id}/pay`)
                .send({ paymentId: 'mock_payment_123' });

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.isPaid).toBe(true);
            expect(res.body.data.paidAt).toBeDefined();
            expect(res.body.data.paymentResult.id).toBe('mock_payment_123');
            if (order.orderStatus === 'Pending') { // Controller logic
                expect(res.body.data.orderStatus).toBe('Processing');
            }
        });
    });

    describe('PUT /api/orders/:id/deliver', () => {
        it('should update order to delivered by admin', async () => {
             authMiddlewareMockFuncs.protect.mockImplementationOnce((req, res, next) => {
                req.user = { ...authMiddlewareMockFuncs.mockUser, role: 'admin' };
                next();
            });
            // Order must be paid first as per controller logic
            const order = await Order.create({ ...testOrderData, user: new mongoose.Types.ObjectId(), isPaid: true, paidAt: new Date(), orderStatus: 'Processing' });

            const res = await request(app).put(`/api/orders/${order._id}/deliver`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.isDelivered).toBe(true);
            expect(res.body.data.deliveredAt).toBeDefined();
            expect(res.body.data.orderStatus).toBe('Delivered');
        });

        it('should fail to mark as delivered if order is not paid', async () => {
            authMiddlewareMockFuncs.protect.mockImplementationOnce((req, res, next) => {
                req.user = { ...authMiddlewareMockFuncs.mockUser, role: 'admin' };
                next();
            });
            const order = await Order.create({ ...testOrderData, user: new mongoose.Types.ObjectId(), isPaid: false });
            const res = await request(app).put(`/api/orders/${order._id}/deliver`);
            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBe('Order is not paid yet');
        });
    });

    describe('GET /api/orders/myorders', () => {
        it('should get orders for the logged-in customer', async () => {
            const customerId = testUser._id.toString();
             authMiddlewareMockFuncs.protect.mockImplementationOnce((req, res, next) => {
                req.user = { ...authMiddlewareMockFuncs.mockUser, role: 'customer', _id: customerId, id: customerId };
                next();
            });
            await Order.create({ ...testOrderData, user: customerId, totalPrice: 110 });
            await Order.create({ ...testOrderData, user: customerId, totalPrice: 120 });
            await Order.create({ ...testOrderData, user: new mongoose.Types.ObjectId(), totalPrice: 130 }); // Another user's order

            const res = await request(app).get('/api/orders/myorders');
            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toBe(2);
            expect(res.body.data.every(o => o.user.toString() === customerId)).toBe(true);
        });
    });

    describe('GET /api/orders', () => {
        it('should get all orders for admin', async () => {
            authMiddlewareMockFuncs.protect.mockImplementationOnce((req, res, next) => {
                req.user = { ...authMiddlewareMockFuncs.mockUser, role: 'admin' };
                next();
            });
            await Order.create({ ...testOrderData, user: new mongoose.Types.ObjectId() });
            await Order.create({ ...testOrderData, user: new mongoose.Types.ObjectId() });

            const res = await request(app).get('/api/orders');
            expect(res.statusCode).toEqual(200);
            expect(res.body.count).toBe(2);
        });
    });

    // Add tests for updateOrderStatus
});
