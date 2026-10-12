const nodemailer = require('nodemailer');
const logger = require('./logger');

const sendEmail = async (options) => {
    // 1. Create a transporter
    let transporter;
    const pass = (process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');
    const service = process.env.EMAIL_SERVICE || (process.env.SMTP_HOST ? null : 'gmail');

    if (service) {
        transporter = nodemailer.createTransport({
            service, // e.g., 'gmail'
            auth: {
                user: process.env.EMAIL_USER,
                pass
            }
        });
    } else {
        // Fallback to standard SMTP (for custom SMTP like SendGrid, AWS SES)
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_EMAIL || process.env.EMAIL_USER,
                pass
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
