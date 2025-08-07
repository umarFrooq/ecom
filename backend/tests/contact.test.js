const request = require('supertest');
const express = require('express');
const { errorHandler } = require('../middleware/errorHandler');
const contactRoutes = require('../routes/contactRoutes');

// Mock the sendEmail utility
// The factory now returns jest.fn() directly.
jest.mock('../utils/sendEmail', () => jest.fn());
// After the mock is set up, require the mocked module to get the mock function.
const mockSendEmail = require('../utils/sendEmail');


const app = express();
app.use(express.json());
app.use('/api/contact', contactRoutes);
app.use(errorHandler);

describe('Contact API Endpoint', () => {
    beforeEach(() => {
        // Clear mock usage before each test
        mockSendEmail.mockClear();
    });

    describe('POST /api/contact', () => {
        it('should successfully submit the contact form and attempt to send an email', async () => {
            mockSendEmail.mockResolvedValueOnce({ messageId: 'mock-message-id' }); // Simulate successful email send

            const contactData = {
                name: 'Test User',
                email: 'test@example.com',
                phone: '1234567890',
                subject: 'Test Inquiry',
                message: 'This is a test message.',
            };

            const res = await request(app)
                .post('/api/contact')
                .send(contactData);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Your message has been sent successfully!');

            expect(mockSendEmail).toHaveBeenCalledTimes(1);
            expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: process.env.CONTACT_FORM_RECEIVER_EMAIL || 'admin@example.com',
                replyTo: contactData.email,
                subject: `Contact Form: ${contactData.subject} from ${contactData.name}`,
                message: expect.stringContaining(contactData.message),
            }));
        });

        it('should return 400 if required fields (name, email, message) are missing', async () => {
            const incompleteData = { name: 'Test' }; // Missing email and message
            const res = await request(app)
                .post('/api/contact')
                .send(incompleteData);

            expect(res.statusCode).toEqual(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Please provide name, email, and message.');
            expect(mockSendEmail).not.toHaveBeenCalled();
        });

        it('should return 400 for an invalid email format', async () => {
            const invalidEmailData = {
                name: 'Test User',
                email: 'invalid-email',
                message: 'Test message'
            };
            const res = await request(app)
                .post('/api/contact')
                .send(invalidEmailData);

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toBe('Please provide a valid email address.');
            expect(mockSendEmail).not.toHaveBeenCalled();
        });

        it('should handle errors if email sending fails', async () => {
            mockSendEmail.mockRejectedValueOnce(new Error('SMTP Error')); // Simulate email sending failure

            const contactData = {
                name: 'Test User Fail',
                email: 'testfail@example.com',
                subject: 'Failure Test',
                message: 'This email should fail to send.',
            };

            const res = await request(app)
                .post('/api/contact')
                .send(contactData);

            expect(res.statusCode).toEqual(500);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBe('Your message could not be sent at this time. Please try again later.');
            expect(mockSendEmail).toHaveBeenCalledTimes(1);
        });
    });
});
