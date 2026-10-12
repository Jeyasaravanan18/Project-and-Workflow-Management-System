const { sendEmailMessage } = require('../services/emailService');

const sendEmail = async (options) => {
    return sendEmailMessage({
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    });
};

module.exports = sendEmail;
