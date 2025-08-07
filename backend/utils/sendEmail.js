const nodemailer = require('nodemailer');
require('dotenv').config(); // Ensure environment variables are loaded

const sendEmail = async (options) => {
  // 1) Create a transporter
  // For production, use a real email service like SendGrid, Mailgun, AWS SES, etc.
  // For this example, we'll use generic SMTP settings from .env, which could be Gmail (less secure for apps), or a dedicated SMTP service.
  // A common way for testing is to use a service like Mailtrap.io

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT, // Usually 587 for TLS, 465 for SSL, 25 for unencrypted (not recommended)
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports like 587
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // For services like Gmail, you might need to enable "less secure app access" or use OAuth2
    // For production, services like SendGrid often provide an API key to use as password.
    // tls: {
    //   ciphers:'SSLv3' // Example: if you face issues with specific providers
    //   // rejectUnauthorized: false // Use only for debugging, not for production
    // }
  });

  // 2) Define the email options
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Your App Name'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com'}>`,
    to: options.email, // The recipient's email address
    subject: options.subject,
    text: options.message, // Plain text body
    // html: options.html // You can also send HTML content
  };

  if (options.replyTo) {
    mailOptions.replyTo = options.replyTo;
  }
  if (options.fromName && options.fromAddress) { // Allow overriding default from if needed
      mailOptions.from = `"${options.fromName}" <${options.fromAddress}>`;
  }


  // 3) Actually send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info)); // Only if using ethereal.email
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email could not be sent. Please try again later or contact support.');
    // It's important to throw an error so the calling function knows sending failed.
  }
};

module.exports = sendEmail;
