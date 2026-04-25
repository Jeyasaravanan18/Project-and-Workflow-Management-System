const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
    uploadFile,
    getAttachments,
    downloadFile,
    deleteAttachment
} = require('../controllers/attachmentController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');

router.use(protect);

router.post(
    '/',
    upload.single('file'),
    // Note: Validation of req.file is done in controller
    uploadFile
);

// Specific routes must come before generic parameter routes
router.get('/:id/download', downloadFile);
router.get('/:model/:id', getAttachments);
router.delete('/:id', deleteAttachment);

module.exports = router;
