const paymentRoutes = require('../routes/paymentRoutes');

describe('Payment Routes', () => {
    it('should load the payment routes', () => {
        expect(paymentRoutes).toBeDefined();
    });
});
