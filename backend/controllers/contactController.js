const Contact = require('../models/Contact'); // Import the new Contact model
const sendEmail = require('../utils/sendEmail');
const { ErrorResponse } = require('../middleware/errorHandler');

// @desc    Handle contact form submission
// @route   POST /api/contact
// @access  Public
exports.handleContactForm = async (req, res, next) => {
  const { name, email, phone, subject, message } = req.body;

  try {
    // Save to database
    const newContact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
    });

    // Email content
    const contactMessage = `
      You have received a new contact form submission:
      --------------------------------------------------
      Name: ${name}
      Email: ${email}
      Phone: ${phone || 'Not provided'}
      Subject: ${subject || 'No subject'}
      --------------------------------------------------
      Message:
      ${message}
      --------------------------------------------------
    `;

    // Send email notification (optional, but good practice)
    // The process can continue even if email fails, as the message is saved.
    try {
      await sendEmail({
        to: process.env.CONTACT_FORM_RECEIVER_EMAIL || 'admin@example.com',
        replyTo: email,
        subject: `Contact Form: ${subject || 'New Inquiry'} from ${name}`,
        message: contactMessage,
      });
    } catch (emailError) {
      console.error('Failed to send contact form email notification:', emailError);
      // Do not block the response for this. The main goal is saving the message.
    }

    res.status(201).json({
      success: true,
      message: 'Your message has been received and we will get back to you shortly.',
      data: newContact
    });

  } catch (error) {
    // This will catch validation errors from Mongoose or other operational errors
    console.error('Error saving contact form submission:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return next(new ErrorResponse(messages.join(', '), 400));
    }
    next(new ErrorResponse('Your message could not be submitted at this time. Please try again later.', 500));
  }
};

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private/Admin
exports.getContactMessages = async (req, res, next) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    next(new ErrorResponse('Could not retrieve contact messages.', 500));
  }
};
