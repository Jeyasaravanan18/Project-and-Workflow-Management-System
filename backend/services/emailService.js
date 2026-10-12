const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('../utils/logger');

// Lazy transporter creation for local SMTP / Gmail
let transporter = null;
const getTransporter = () => {
    if (!transporter) {
        const pass = process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.replace(/\s+/g, '') : '';
        const service = process.env.EMAIL_SERVICE || 'gmail';

        transporter = nodemailer.createTransport({
            service,
            auth: {
                user: process.env.EMAIL_USER,
                pass
            },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000
        });
    }
    return transporter;
};

// Unified email sending function (supports Resend HTTP API and Nodemailer)
const sendEmailMessage = async ({ to, subject, html, text }) => {
    // 1. Prioritize Resend (HTTP API, port 443 — bypasses Render SMTP firewall block)
    if (process.env.RESEND_API_KEY) {
        const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
        const fromName = process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'ProjectFlow';
        const from = `"${fromName}" <${fromEmail}>`;

        try {
            const response = await axios.post('https://api.resend.com/emails', {
                from,
                to: Array.isArray(to) ? to : [to],
                subject,
                html,
                text
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            logger.info(`✅ Email sent via Resend to ${to} (ID: ${response.data?.id})`);
            return { success: true, messageId: response.data?.id };
        } catch (resendError) {
            const errMsg = resendError.response?.data?.message || resendError.message;
            logger.error(`❌ Resend API delivery error: ${errMsg}`, { data: resendError.response?.data });
            throw new Error(`Resend email delivery failed: ${errMsg}`);
        }
    }

    // 2. Fallback to Nodemailer SMTP (for local dev or paid servers with open SMTP ports)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        const transporter = getTransporter();
        const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
        const fromName = process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'ProjectFlow';

        try {
            const info = await transporter.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to,
                subject,
                html,
                text
            });
            logger.info(`✅ Email sent via SMTP to ${to} (MessageId: ${info.messageId})`);
            return { success: true, messageId: info.messageId };
        } catch (smtpError) {
            logger.error(`❌ SMTP email sending failed: ${smtpError.message}`, { to });
            throw new Error(`SMTP email delivery failed: ${smtpError.message}`);
        }
    }

    throw new Error('No email service configured. Please set RESEND_API_KEY (recommended for Render) or EMAIL_USER & EMAIL_PASSWORD.');
};

// Send invitation email
const sendInvitationEmail = async ({ to, userName, organizationName, invitationLink, role }) => {
    const roleDescription = {
        manager: 'Project Manager - You can create projects, manage tasks, and oversee team progress',
        member: 'Team Member - You can view and update your assigned tasks'
    };

    const html = `
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
    `;

    return sendEmailMessage({
        to,
        subject: `You've been invited to join ${organizationName}`,
        html
    });
};

// Verify email configuration on startup
const verifyEmailConfig = async () => {
    if (process.env.RESEND_API_KEY) {
        logger.info('✅ Email service initialized with Resend (HTTP API, Port 443 — Render compatible)');
        return true;
    }

    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        try {
            const verifyPromise = getTransporter().verify();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('SMTP connection timed out')), 4000)
            );
            await Promise.race([verifyPromise, timeoutPromise]);
            logger.info(`✅ Email service initialized with SMTP (${process.env.EMAIL_USER})`);
            return true;
        } catch (error) {
            logger.warn(`⚠️ SMTP verification failed/timed out: ${error.message}. (Note: Render Free Tier blocks SMTP ports. Use RESEND_API_KEY for Render deployments.)`);
            return false;
        }
    }

    logger.warn('⚠️ No email service configured. Set RESEND_API_KEY (recommended) or EMAIL_USER & EMAIL_PASSWORD.');
    return false;
};

// Send password reset email
const sendPasswordResetEmail = async ({ to, userName, resetLink }) => {
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

    return sendEmailMessage({
        to,
        subject: 'Password Reset Request - ProjectFlow',
        html: htmlTemplate
    });
};

module.exports = {
    sendEmailMessage,
    sendInvitationEmail,
    sendPasswordResetEmail,
    verifyEmailConfig,
    getTransporter
};
