const Task = require('../models/Task');
const Project = require('../models/Project');
const WorkflowStage = require('../models/WorkflowStage');
const { catchAsync } = require('../middleware/errorHandler');
const XLSX = require('xlsx');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build styled Excel column widths based on header content.
 */
const autoWidth = (ws, data) => {
    if (!data || !data.length) return;
    const colWidths = Object.keys(data[0]).map((key) => ({
        wch: Math.max(key.length, ...data.map((row) => String(row[key] ?? '').length)) + 4,
    }));
    ws['!cols'] = colWidths;
};

/**
 * Apply a header style row to the first row of a worksheet.
 */
const applyHeaderStyle = (ws, numCols) => {
    const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill: { fgColor: { rgb: '1E293B' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
            top: { style: 'thin', color: { rgb: 'CBD5E1' } },
            bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
            left: { style: 'thin', color: { rgb: 'CBD5E1' } },
            right: { style: 'thin', color: { rgb: 'CBD5E1' } },
        },
    };
    for (let c = 0; c < numCols; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[cellAddr]) ws[cellAddr].s = headerStyle;
    }
};

/**
 * Format seconds to h:mm string.
 */
const formatTime = (seconds) => {
    if (!seconds) return '0h 0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
};

const formatDate = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');

// ─── Task Export Handler ────────────────────────────────────────────────────

/**
 * @desc    Export tasks to CSV or Excel
 * @route   GET /api/export/tasks?format=csv|xlsx&projectId=&status=&priority=
 * @access  Private
 */
const exportTasks = catchAsync(async (req, res) => {
    const { projectId, status, priority, format = 'xlsx' } = req.query;

    const query = { organizationId: req.user.organizationId };
    if (projectId) query.projectId = projectId;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
        .populate('assignedTo', 'name email')
        .populate('projectId', 'name')
        .populate('currentStage', 'name')
        .sort({ createdAt: -1 })
        .lean();

    // Filter by status (stage name) if requested
    const filteredTasks = status
        ? tasks.filter((t) => t.currentStage?.name?.toLowerCase() === status.toLowerCase())
        : tasks;

    // Map to flat rows
    const rows = filteredTasks.map((task, i) => ({
        '#': i + 1,
        Title: task.title || '',
        Status: task.currentStage?.name || 'Unknown',
        Priority: (task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1),
        Project: task.projectId?.name || 'Unassigned',
        Assignees: Array.isArray(task.assignedTo)
            ? task.assignedTo.map((u) => u.name || u.email).join(', ')
            : 'Unassigned',
        'Due Date': formatDate(task.dueDate),
        'Created At': formatDate(task.createdAt),
        'Completed At': formatDate(task.completedAt),
        'Time Spent': formatTime(task.timeSpent),
        'Est. Hours': task.estimatedHours || 0,
    }));

    const exportDate = new Date().toISOString().split('T')[0];

    // ── CSV ──────────────────────────────────────────────────────────────────
    if (format === 'csv') {
        const headers = Object.keys(rows[0] || { '#': '', Title: '', Status: '', Priority: '', Project: '', Assignees: '', 'Due Date': '', 'Created At': '', 'Completed At': '', 'Time Spent': '', 'Est. Hours': '' });
        let csv = headers.join(',') + '\n';
        rows.forEach((row) => {
            csv += headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
        });
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="tasks-export-${exportDate}.csv"`);
        return res.send('\uFEFF' + csv); // BOM for Excel auto-detection
    }

    // ── Excel ────────────────────────────────────────────────────────────────
    const wb = XLSX.utils.book_new();

    // Sheet 1: Tasks
    const wsData = rows.length > 0 ? rows : [{ '#': '', Title: 'No tasks found', Status: '', Priority: '', Project: '', Assignees: '', 'Due Date': '', 'Created At': '', 'Completed At': '', 'Time Spent': '', 'Est. Hours': '' }];
    const ws = XLSX.utils.json_to_sheet(wsData);
    autoWidth(ws, wsData);
    applyHeaderStyle(ws, Object.keys(wsData[0]).length);
    ws['!freeze'] = { xSplit: 0, ySplit: 1 }; // Freeze header row
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');

    // Sheet 2: Summary by Status
    const statusMap = {};
    filteredTasks.forEach((t) => {
        const s = t.currentStage?.name || 'Unknown';
        statusMap[s] = (statusMap[s] || 0) + 1;
    });
    const summaryRows = Object.entries(statusMap).map(([status, count]) => ({
        Status: status,
        Count: count,
        Percentage: filteredTasks.length > 0 ? `${((count / filteredTasks.length) * 100).toFixed(1)}%` : '0%',
    }));
    if (summaryRows.length === 0) summaryRows.push({ Status: 'No data', Count: 0, Percentage: '0%' });
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    autoWidth(wsSummary, summaryRows);
    applyHeaderStyle(wsSummary, 3);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Task Status Summary');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="tasks-export-${exportDate}.xlsx"`);
    res.setHeader('Content-Length', buf.length);
    return res.send(buf);
});

// ─── Analytics Export Handler ───────────────────────────────────────────────

/**
 * @desc    Export analytics (project progress + task distribution) to CSV or Excel
 * @route   GET /api/export/analytics?format=csv|xlsx
 * @access  Private (Admin)
 */
const exportAnalytics = catchAsync(async (req, res) => {
    const { format = 'xlsx' } = req.query;
    const orgId = req.user.organizationId;

    // === Project Progress ===
    const projects = await Project.find({ organizationId: orgId }).lean();

    const projectRows = await Promise.all(
        projects.map(async (project) => {
            const allTasks = await Task.find({ projectId: project._id }).populate('currentStage', 'name').lean();
            const totalTasks = allTasks.length;
            const completedTasks = allTasks.filter((t) =>
                ['done', 'completed', 'closed'].includes(t.currentStage?.name?.toLowerCase())
            ).length;
            const inProgress = allTasks.filter((t) =>
                t.currentStage?.name?.toLowerCase().includes('progress')
            ).length;
            const overdue = allTasks.filter(
                (t) => t.dueDate && new Date(t.dueDate) < new Date() && !t.completedAt
            ).length;
            const completionRate = totalTasks > 0 ? `${((completedTasks / totalTasks) * 100).toFixed(1)}%` : '0%';

            return {
                Project: project.name || 'Unnamed',
                'Total Tasks': totalTasks,
                Completed: completedTasks,
                'In Progress': inProgress,
                Pending: totalTasks - completedTasks - inProgress,
                Overdue: overdue,
                'Completion Rate': completionRate,
            };
        })
    );

    // === Task Status Distribution ===
    const allOrgTasks = await Task.find({ organizationId: orgId }).populate('currentStage', 'name').lean();
    const statusDistrib = {};
    allOrgTasks.forEach((t) => {
        const s = t.currentStage?.name || 'Unknown';
        statusDistrib[s] = (statusDistrib[s] || 0) + 1;
    });
    const statusRows = Object.entries(statusDistrib).map(([status, count]) => ({
        Status: status,
        Count: count,
        Percentage: allOrgTasks.length > 0 ? `${((count / allOrgTasks.length) * 100).toFixed(1)}%` : '0%',
    }));

    const exportDate = new Date().toISOString().split('T')[0];

    // ── CSV ──────────────────────────────────────────────────────────────────
    if (format === 'csv') {
        const ph = Object.keys(projectRows[0] || { Project: '' });
        let csv = `PROJECT PROGRESS REPORT - ${exportDate}\n`;
        csv += ph.join(',') + '\n';
        (projectRows.length ? projectRows : []).forEach((row) => {
            csv += ph.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
        });
        csv += '\n\nTASK STATUS DISTRIBUTION\n';
        const sh = ['Status', 'Count', 'Percentage'];
        csv += sh.join(',') + '\n';
        statusRows.forEach((row) => {
            csv += sh.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${exportDate}.csv"`);
        return res.send('\uFEFF' + csv);
    }

    // ── Excel ────────────────────────────────────────────────────────────────
    const wb = XLSX.utils.book_new();

    // Sheet 1: Project Progress
    const projData = projectRows.length > 0 ? projectRows : [{ Project: 'No projects found', 'Total Tasks': 0, Completed: 0, 'In Progress': 0, Pending: 0, Overdue: 0, 'Completion Rate': '0%' }];
    const wsProj = XLSX.utils.json_to_sheet(projData);
    autoWidth(wsProj, projData);
    applyHeaderStyle(wsProj, Object.keys(projData[0]).length);
    wsProj['!freeze'] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(wb, wsProj, 'Project Progress');

    // Sheet 2: Status Distribution
    const statusData = statusRows.length > 0 ? statusRows : [{ Status: 'No data', Count: 0, Percentage: '0%' }];
    const wsStatus = XLSX.utils.json_to_sheet(statusData);
    autoWidth(wsStatus, statusData);
    applyHeaderStyle(wsStatus, 3);
    XLSX.utils.book_append_sheet(wb, wsStatus, 'Task Distribution');

    // Sheet 3: Metadata / Report Info
    const metaRows = [
        { Field: 'Report Generated', Value: new Date().toLocaleString() },
        { Field: 'Total Projects', Value: projects.length },
        { Field: 'Total Tasks (Org)', Value: allOrgTasks.length },
        { Field: 'Completed Tasks', Value: allOrgTasks.filter((t) => t.completedAt).length },
        { Field: 'Overdue Tasks', Value: allOrgTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && !t.completedAt).length },
        { Field: 'Report Type', Value: 'Analytics Dashboard Export' },
        { Field: 'Platform', Value: 'Harmonic Halo Enterprise' },
    ];
    const wsMeta = XLSX.utils.json_to_sheet(metaRows);
    autoWidth(wsMeta, metaRows);
    applyHeaderStyle(wsMeta, 2);
    XLSX.utils.book_append_sheet(wb, wsMeta, 'Report Info');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${exportDate}.xlsx"`);
    res.setHeader('Content-Length', buf.length);
    return res.send(buf);
});

module.exports = {
    exportTasks,
    exportAnalytics,
};
