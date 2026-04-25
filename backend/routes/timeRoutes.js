const express = require('express');
const router = express.Router();
const {
    startTimeEntry,
    stopTimeEntry,
    getActiveTimer,
    getTimeEntries,
    createManualEntry
} = require('../controllers/timeController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { body } = require('express-validator');

const startValidation = [
    body('taskId').isMongoId().withMessage('Invalid Task ID')
];

router.use(protect);

router.get('/', getTimeEntries);
router.get('/active', getActiveTimer);
router.post('/start', startValidation, validate, startTimeEntry);
router.post('/stop', stopTimeEntry);
router.post('/', createManualEntry);

module.exports = router;
