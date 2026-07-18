const nodemailer = require('nodemailer');
const logger = require('./logger');

const sendEmail = async (options) => {
    // 1. Create a transporter
    let transporter;

    // Check if we are using a specific service (like Gmail)
    // This is the "Best Solution" for the current dev setup as per user request
    if (process.env.EMAIL_SERVICE) {
        transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    } else {
        // Fallback to standard SMTP (for production providers like SendGrid, AWS SES)
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_EMAIL || process.env.EMAIL_USER,
                pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD
            }
        });
    }

    // 2. Define email options
    const message = {
        from: `${process.env.EMAIL_FROM_NAME || 'ProjectFlow'} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html // Support for HTML emails
    };

    // 3. Send email
    try {
        const info = await transporter.sendMail(message);
        logger.info(`Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error('Error sending email:', error);

        // Add specific advice for Gmail users
        if (process.env.EMAIL_SERVICE === 'gmail' && error.response && error.response.includes('Username and Password not accepted')) {
            logger.error('GMAIL HINT: You might need to use an App Password if 2FA is enabled. Go to Google Account > Security > App Passwords.');
        }

        throw error;
    }
};

module.exports = sendEmail;
