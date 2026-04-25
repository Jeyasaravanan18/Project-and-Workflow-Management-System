const Attachment = require('../models/Attachment');
const { catchAsync } = require('../middleware/errorHandler');
const { NotFoundError, AuthorizationError, ValidationError } = require('../utils/AppError');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Upload file
 * @route   POST /api/attachments
 * @access  Private
 */
const uploadFile = catchAsync(async (req, res) => {
    if (!req.file) {
        throw new ValidationError('No file uploaded');
    }

    const { model, id } = req.body;

    if (!model || !id) {
        // Cleanup file if validation fails
        const filePath = req.file.path;
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw new ValidationError('Related entity model and ID are required');
    }

    const attachment = await Attachment.create({
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploader: req.user._id,
        relatedEntity: {
            model,
            id
        }
    });

    logger.info('File uploaded', { attachmentId: attachment._id, userId: req.user._id });

    res.status(201).json({
        success: true,
        data: attachment
    });
});

/**
 * @desc    Get attachments for entity
 * @route   GET /api/attachments/:model/:id
 * @access  Private
 */
const getAttachments = catchAsync(async (req, res) => {
    const { model, id } = req.params;

    const attachments = await Attachment.find({
        'relatedEntity.model': model,
        'relatedEntity.id': id
    }).populate('uploader', 'name avatar');

    res.json({
        success: true,
        data: attachments
    });
});

/**
 * @desc    Download file
 * @route   GET /api/attachments/:id/download
 * @access  Private
 */
const downloadFile = catchAsync(async (req, res) => {
    console.log('[DEBUG] Download Request ID:', req.params.id);

    const attachment = await Attachment.findById(req.params.id);

    if (!attachment) {
        throw new NotFoundError('Attachment not found');
    }

    console.log('[DEBUG] Download request for:', attachment.originalName);
    console.log('[DEBUG] Stored path:', attachment.path);

    // Check if file exists on disk
    // attachment.path already contains the full path from multer
    const fileExists = fs.existsSync(attachment.path);
    console.log('[DEBUG] File exists?', fileExists);

    if (!fileExists) {
        console.error('[ERROR] File missing at path:', attachment.path);
        throw new NotFoundError('File not found on server');
    }

    // Send file for download
    res.download(attachment.path, attachment.originalName, (err) => {
        if (err) {
            console.error('[ERROR] Download failed:', err);
            logger.error('Download error', { error: err.message, attachmentId: attachment._id });
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error downloading file' });
            }
        }
    });
});

/**
 * @desc    Delete attachment
 * @route   DELETE /api/attachments/:id
 * @access  Private
 */
const deleteAttachment = catchAsync(async (req, res) => {
    const attachment = await Attachment.findById(req.params.id);

    if (!attachment) {
        throw new NotFoundError('Attachment not found');
    }

    if (attachment.uploader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new AuthorizationError('Not authorized to delete this file');
    }

    // Delete file from disk
    if (fs.existsSync(attachment.path)) {
        fs.unlinkSync(attachment.path);
    }

    await attachment.deleteOne();

    logger.info('Attachment deleted', { attachmentId: attachment._id });

    res.json({
        success: true,
        message: 'Attachment deleted successfully'
    });
});

module.exports = {
    uploadFile,
    getAttachments,
    downloadFile,
    deleteAttachment
};
