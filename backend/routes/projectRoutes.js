const express = require('express');
const router = express.Router();
const {
    createProject,
    getProjects,
    getProjectById,
    getProjectDashboard,
    getProjectTeamMembers,
    getProjectMembers,
    addProjectMember,
    removeProjectMember,
    scaffoldProject
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');
const auditLogger = require('../middleware/auditMiddleware');
const { validate } = require('../middleware/validate');
const {
    createProjectValidation,
    projectIdValidation,
    getProjectsValidation,
    addProjectMemberValidation,
    removeProjectMemberValidation
} = require('../middleware/validators/projectValidator');

// All routes require authentication
router.use(protect);

// Project CRUD
router.route('/')
    .get(getProjectsValidation, validate, getProjects)
    .post(authorize('admin', 'manager'), createProjectValidation, validate, auditLogger('CREATE_PROJECT', 'Project'), createProject);

router.route('/:id')
    .get(projectIdValidation, validate, getProjectById);

// AI Project Scaffolder
router.post('/:id/scaffold', authorize('admin', 'manager'), projectIdValidation, validate, auditLogger('SCAFFOLD_PROJECT', 'Project'), scaffoldProject);

// Project dashboard and analytics
router.get('/:id/dashboard', projectIdValidation, validate, getProjectDashboard);

// Project team management
router.get('/:id/team', projectIdValidation, validate, getProjectTeamMembers);
router.get('/:id/members', projectIdValidation, validate, getProjectMembers);

router.post(
    '/:id/members',
    authorize('admin', 'manager'),
    addProjectMemberValidation,
    validate,
    auditLogger('ADD_PROJECT_MEMBER', 'Project'),
    addProjectMember
);

router.delete(
    '/:id/members/:userId',
    authorize('admin', 'manager'),
    removeProjectMemberValidation,
    validate,
    auditLogger('REMOVE_PROJECT_MEMBER', 'Project'),
    removeProjectMember
);

module.exports = router;
