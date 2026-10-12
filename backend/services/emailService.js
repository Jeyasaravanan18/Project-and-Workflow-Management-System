const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Lazy transporter creation - only create when needed, not at module load
let transporter = null;
const getTransporter = () => {
    if (!transporter) {
        // Strip any spaces if the user copied Google App Password formatted with spaces (e.g. 'abcd efgh ijkl mnop')
        const pass = process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.replace(/\s+/g, '') : '';
        const service = process.env.EMAIL_SERVICE || 'gmail';

        transporter = nodemailer.createTransport({
            service,
            auth: {
                user: process.env.EMAIL_USER,
                pass
            }
        });
    }
    return transporter;
};

// Send invitation email
const sendInvitationEmail = async ({ to, userName, organizationName, invitationLink, role }) => {
    const roleDescription = {
        manager: 'Project Manager - You can create projects, manage tasks, and oversee team progress',
        member: 'Team Member - You can view and update your assigned tasks'
    };

    const mailOptions = {
        from: `"${process.env.APP_NAME || 'ProjectFlow'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject: `You've been invited to join ${organizationName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                    .button:hover { background: #5568d3; }
                    .info-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 24px;">🎉 Welcome to ${organizationName}!</h1>
                    </div>
                    <div class="content">
                        <p>Hi <strong>${userName}</strong>,</p>
                        
                        <p>You've been invited to join <strong>${organizationName}</strong> as a <strong>${role.charAt(0).toUpperCase() + role.slice(1)}</strong>.</p>
                        
                        <div class="info-box">
                            <strong>Your Role:</strong><br>
                            ${roleDescription[role] || 'Team member'}
                        </div>
                        
                        <p>Click the button below to set your password and get started:</p>
                        
                        <div style="text-align: center;">
                            <a href="${invitationLink}" class="button">Accept Invitation & Set Password</a>
                        </div>
                        
                        <p style="color: #6b7280; font-size: 14px;">
                            Or copy and paste this link into your browser:<br>
                            <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 8px;">${invitationLink}</code>
                        </p>
                        
                        <p style="color: #ef4444; font-size: 14px; margin-top: 30px;">
                            ⚠️ This invitation link will expire in <strong>24 hours</strong>.
                        </p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply.</p>
                        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await getTransporter().sendMail(mailOptions);
        logger.info(`✅ Invitation email sent to ${to} (MessageId: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error('❌ Failed to send invitation email:', { error: error.message, to });
        throw new Error('Failed to send invitation email: ' + error.message);
    }
};

// Verify email configuration on startup
const verifyEmailConfig = async () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        logger.warn('⚠️ EMAIL_USER or EMAIL_PASSWORD not set in environment variables. Email sending is currently disabled.');
        return false;
    }

    try {
        await getTransporter().verify();
        logger.info(`✅ Email service is ready to send emails via ${process.env.EMAIL_SERVICE || 'gmail'} (${process.env.EMAIL_USER})`);
        return true;
    } catch (error) {
        logger.error(`❌ Email service configuration verification failed: ${error.message}`);
        if (error.response && error.response.includes('Username and Password not accepted')) {
            logger.error('GMAIL HINT: Google requires a 16-character App Password (not your normal Gmail account password). Ensure 2FA is enabled and generate an App Password in your Google Account.');
        }
        return false;
    }
};

// Send password reset email
const sendPasswordResetEmail = async ({ to, userName, resetLink }) => {
    // Read template
    const templatePath = path.join(__dirname, '../templates/email/passwordReset.html');
    let htmlTemplate = '';
    
    if (fs.existsSync(templatePath)) {
        htmlTemplate = fs.readFileSync(templatePath, 'utf8');
        htmlTemplate = htmlTemplate.replace(/{{userName}}/g, userName || 'User');
        htmlTemplate = htmlTemplate.replace(/{{resetLink}}/g, resetLink);
    } else {
        htmlTemplate = `
            <h2>Password Reset Request</h2>
            <p>Hi ${userName || 'User'},</p>
            <p>You requested a password reset. Please click the link below to set a new password:</p>
            <p><a href="${resetLink}">Reset Password</a></p>
            <p>If you did not request this, please ignore this email.</p>
        `;
    }

    const mailOptions = {
        from: `"${process.env.APP_NAME || 'ProjectFlow'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject: 'Password Reset Request - ProjectFlow',
        html: htmlTemplate
    };

    try {
        const info = await getTransporter().sendMail(mailOptions);
        logger.info(`✅ Password reset email sent to ${to} (MessageId: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error('❌ Failed to send password reset email:', { error: error.message, to });
        throw new Error('Failed to send password reset email: ' + error.message);
    }
};

module.exports = {
    sendInvitationEmail,
    sendPasswordResetEmail,
    verifyEmailConfig,
    getTransporter
};
