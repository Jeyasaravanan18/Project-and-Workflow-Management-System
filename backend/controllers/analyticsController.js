const Task = require("../models/Task");
const User = require("../models/User");
const WorkflowStage = require("../models/WorkflowStage");
const Project = require("../models/Project");
const ActivityLog = require("../models/ActivityLog");

// @desc    Get Team Workload Distribution (Role-based)
// @route   GET /api/analytics/workload
// @access  Private (All authenticated users)
const getWorkload = async (req, res) => {
  try {
    const currentUser = req.user;

    // For members: return only their own workload
    if (currentUser.role === "member") {
      const myTasks = await Task.find({
        assignedTo: currentUser._id,
        completedAt: { $exists: false },
      });

      // Get task distribution for this member
      const taskDistribution = await Task.aggregate([
        { $match: { assignedTo: currentUser._id, completedAt: { $exists: false } } },
        {
          $lookup: {
            from: "workflowstages",
            localField: "currentStage",
            foreignField: "_id",
            as: "stageInfo",
          },
        },
        { $unwind: { path: "$stageInfo", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ["$stageInfo.name", "No Stage"] },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            status: "$_id",
            count: 1,
            _id: 0,
          },
        },
      ]);

      const myStats = {
        userId: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        activeTasks: myTasks.length,
        taskDistribution,
        estimatedHours: myTasks.reduce(
          (sum, task) => sum + (task.estimatedHours || 0),
          0,
        ),
        status:
          myTasks.length > 5
            ? "Overloaded"
            : myTasks.length === 0
              ? "Idle"
              : "Optimal",
      };

      return res.json({
        success: true,
        data: {
          viewType: "individual",
          userRole: "member",
          myWorkload: myStats,
          summary: {
            totalActiveTasks: myStats.activeTasks,
            totalEstimatedHours: myStats.estimatedHours,
            status: myStats.status,
          },
        }
      });
    }

    // For managers and admins: return team-wide workload
    // Exclude admins from the list
    const orgUsers = await User.find({
      organizationId: currentUser.organizationId,
      role: { $ne: "admin" },
    }).select("_id name email role");
    const orgUserIds = orgUsers.map((u) => u._id);

    // FIXED: Unwind assignedTo array before grouping to get accurate counts
    const tasksCount = await Task.aggregate([
      {
        $match: {
          assignedTo: { $in: orgUserIds },
          completedAt: { $exists: false },
        },
      },
      // Unwind the assignedTo array so each user gets counted separately
      { $unwind: "$assignedTo" },
      // Filter again after unwind to only count org users
      {
        $match: {
          assignedTo: { $in: orgUserIds },
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          count: { $sum: 1 },
          estimatedHours: { $sum: "$estimatedHours" },
        },
      },
    ]);

    // Merge results and categorize
    const workloadData = orgUsers.map((user) => {
      const stats = tasksCount.find(
        (t) => t._id.toString() === user._id.toString(),
      ) || { count: 0, estimatedHours: 0 };
      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        activeTasks: stats.count,
        estimatedHours: stats.estimatedHours || 0,
        status:
          stats.count > 5
            ? "Overloaded"
            : stats.count === 0
              ? "Idle"
              : "Optimal",
      };
    });

    // Sort by active tasks (descending) - most loaded first
    workloadData.sort((a, b) => b.activeTasks - a.activeTasks);

    // Calculate summary statistics
    const summary = {
      totalMembers: workloadData.length,
      overloaded: workloadData.filter((u) => u.status === "Overloaded").length,
      optimal: workloadData.filter((u) => u.status === "Optimal").length,
      idle: workloadData.filter((u) => u.status === "Idle").length,
      avgTasksPerMember:
        workloadData.length > 0
          ? (
              workloadData.reduce((sum, u) => sum + u.activeTasks, 0) /
              workloadData.length
            ).toFixed(1)
          : 0,
      totalActiveTasks: workloadData.reduce((sum, u) => sum + u.activeTasks, 0),
      totalEstimatedHours: workloadData.reduce(
        (sum, u) => sum + u.estimatedHours,
        0,
      ),
    };

    // Return sorted data with summary
    console.log(
      "[Analytics] Workload data:",
      workloadData.length,
      "members found",
    );
    res.json({
      success: true,
      data: {
        viewType: "team",
        userRole: currentUser.role,
        summary,
        members: workloadData,
        topLoaded: workloadData.slice(0, 10), // Top 10 most loaded
        leastLoaded: workloadData
          .filter((u) => u.activeTasks === 0)
          .slice(0, 10), // Up to 10 idle members
      },
    });
  } catch (error) {
    console.error("[Analytics] Workload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Workflow Bottlenecks
// @route   GET /api/analytics/bottlenecks
// @access  Private (Admin/Manager)
const getBottlenecks = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const { projectId } = req.query; // Optional filter

    // Get all projects for this organization
    const projects = await Project.find({ organizationId: orgId }).select(
      "_id",
    );
    const projectIds = projects.map((p) => p._id);

    if (projectIds.length === 0) {
      return res.json({
        stuckTaskCount: 0,
        stageAnalysis: {},
        stuckTasks: [],
        aiRecommendations: [],
      });
    }

    // Find tasks in non-complete stages that haven't been updated in > 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const filter = {
      projectId: projectId ? projectId : { $in: projectIds }, // Filter by org's projects
      updatedAt: { $lt: threeDaysAgo },
      completedAt: { $exists: false },
    };

    const bottlenecks = await Task.find(filter)
      .populate("currentStage")
      .populate("assignedTo", "name")
      .populate("projectId", "name")
      .sort({ updatedAt: 1 }) // Oldest first
      .limit(20);

    // Group by stage to see where stuck
    const stageAnalysis = bottlenecks.reduce((acc, task) => {
      const stageName = task.currentStage ? task.currentStage.name : "Unknown";
      acc[stageName] = (acc[stageName] || 0) + 1;
      return acc;
    }, {});

    const stuckTasks = bottlenecks.map((t) => ({
      id: t._id,
      title: t.title,
      stage: t.currentStage?.name,
      assignedTo: t.assignedTo?.map((a) => a.name).join(", ") || "Unassigned",
      project: t.projectId?.name,
      daysStuck: Math.floor(
        (Date.now() - new Date(t.updatedAt)) / (1000 * 60 * 60 * 24),
      ),
    }));

    // Generate AI recommendations
    const {
      generateBottleneckRecommendations,
    } = require("../services/aiService");
    const aiRecommendations = await generateBottleneckRecommendations({
      stuckTaskCount: bottlenecks.length,
      stageAnalysis,
      stuckTasks,
    });

    res.json({
      stuckTaskCount: bottlenecks.length,
      stageAnalysis,
      stuckTasks,
      aiRecommendations, // NEW: Real AI recommendations
    });
  } catch (error) {
    console.error("[Analytics] Bottlenecks error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard overview analytics
// @route   GET /api/analytics/overview
// @access  Private (Admin)
const getOverview = async (req, res) => {
  try {
    const orgId = req.user.organizationId;

    // Get all projects for this organization
    const projects = await Project.find({ organizationId: orgId }).select(
      "_id",
    );
    const projectIds = projects.map((p) => p._id);

    // Get task statistics
    const totalTasks = await Task.countDocuments({
      projectId: { $in: projectIds },
    });
    const completedTasks = await Task.countDocuments({
      projectId: { $in: projectIds },
      completedAt: { $exists: true, $ne: null },
    });
    const activeTasks = totalTasks - completedTasks;

    // Calculate completion rate based on tasks
    const completionRate =
      totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

    res.json({
      totalTasks,
      completedTasks,
      activeTasks,
      completionRate: parseFloat(completionRate),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get team productivity metrics
// @route   GET /api/analytics/team-productivity
// @access  Private (Admin)
const getTeamProductivity = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const users = await User.find({
      organizationId: orgId,
      status: "active",
    }).select("name role");
    const userPerformance = await Promise.all(
      users.map(async (user) => {
        const tasksCompleted = await Task.countDocuments({
          organizationId: orgId,
          assignedTo: user._id,
          isCompleted: true,
        });
        return {
          userId: user._id,
          name: user.name,
          role: user.role,
          tasksCompleted,
        };
      }),
    );
    const topPerformers = userPerformance
      .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
      .slice(0, 10);
    const roleDistribution = await User.aggregate([
      { $match: { organizationId: orgId, status: "active" } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);
    res.json({ topPerformers, roleDistribution });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get project insights
// @route   GET /api/analytics/project-insights
// @access  Private (Admin)
const getProjectInsights = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const projects = await Project.find({ organizationId: orgId }).select(
      "name status",
    );
    const projectMetrics = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({
          projectId: project._id,
        });
        const completedTasks = await Task.countDocuments({
          projectId: project._id,
          isCompleted: true,
        });
        const completion =
          totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;
        return {
          projectId: project._id,
          name: project.name,
          status: project.status,
          totalTasks,
          completedTasks,
          completion: parseFloat(completion),
        };
      }),
    );
    const taskDistribution = await Task.aggregate([
      { $match: { organizationId: orgId } },
      {
        $lookup: {
          from: "workflowstages",
          localField: "currentStage",
          foreignField: "_id",
          as: "stage",
        },
      },
      { $unwind: "$stage" },
      { $group: { _id: "$stage.name", count: { $sum: 1 } } },
    ]);
    res.json({
      projects: projectMetrics,
      taskDistribution: taskDistribution.map((t) => ({
        stage: t._id,
        count: t.count,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Recent Activities for Organization
// @route   GET /api/analytics/recent-activities
// @access  Private (Admin)
const getRecentActivities = async (req, res) => {
  try {
    const orgId = req.user.organizationId;

    // Fetch recent activity logs for the entire organization
    const activities = await ActivityLog.find({ organizationId: orgId })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate("userId", "name");

    // Format activities with human-readable messages
    const formattedActivities = activities.map((activity) => {
      let message, icon, color;

      switch (activity.action) {
        case "CREATED_PROJECT":
          message = `${activity.userId?.name || "User"} created a project`;
          icon = "FolderKanban";
          color = "#22c55e";
          break;
        case "CREATED_TASK":
          message = `${activity.userId?.name || "User"} created a task`;
          icon = "CheckCircle2";
          color = "#f97316";
          break;
        case "INVITED_USER":
          message = `${activity.userId?.name || "User"} invited team member`;
          icon = "UserPlus";
          color = "#475569";
          break;
        case "UPDATED_TASK_STATUS":
          message = `${activity.userId?.name || "User"} updated task status`;
          icon = "Activity";
          color = "#6366f1";
          break;
        case "COMPLETED_TASK":
          message = `${activity.userId?.name || "User"} completed a task`;
          icon = "CheckCircle2";
          color = "#10b981";
          break;
        default:
          message = `${activity.userId?.name || "User"} performed an action`;
          icon = "Activity";
          color = "#64748b";
      }

      return {
        id: activity._id,
        type: activity.entityType.toLowerCase(),
        message,
        timestamp: activity.timestamp,
        icon,
        color,
      };
    });

    res.json(formattedActivities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tasks grouped by status
// @route   GET /api/analytics/tasks-by-status
// @access  Private (Admin)
const getTasksByStatus = async (req, res) => {
  try {
    const orgId = req.user.organizationId;

    // Get all projects for organization
    const projects = await Project.find({ organizationId: orgId }).select(
      "_id",
    );
    const projectIds = projects.map((p) => p._id);

    // Return empty array if no projects
    if (projectIds.length === 0) {
      console.log("[Analytics] No projects found for organization:", orgId);
      return res.json({ success: true, data: [] });
    }

    // Aggregate tasks by workflow stage
    const tasksByStatus = await Task.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      {
        $lookup: {
          from: "workflowstages",
          localField: "currentStage",
          foreignField: "_id",
          as: "stageInfo",
        },
      },
      // Use $unwind with preserveNullAndEmptyArrays to handle tasks without stages
      { $unwind: { path: "$stageInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$stageInfo.name", "No Stage"] },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    console.log(
      "[Analytics] Tasks by status:",
      tasksByStatus.length,
      "statuses found",
    );
    res.json({ success: true, data: tasksByStatus });
  } catch (error) {
    console.error("getTasksByStatus error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get project progress metrics
// @route   GET /api/analytics/project-progress
// @access  Private (Admin)
const getProjectProgress = async (req, res) => {
  try {
    const orgId = req.user.organizationId;

    const projects = await Project.find({ organizationId: orgId })
      .select("name")
      .lean();

    const progressData = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({
          projectId: project._id,
        });
        const completedTasks = await Task.countDocuments({
          projectId: project._id,
          completedAt: { $exists: true, $ne: null },
        });

        return {
          project: project.name,
          totalTasks,
          completedTasks,
        };
      }),
    );

    console.log(
      "[Analytics] Project progress:",
      progressData.length,
      "projects found",
    );
    res.json({ success: true, data: progressData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get average task completion duration
// @route   GET /api/analytics/avg-duration
// @access  Private (Admin)
const getAvgDuration = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const projects = await Project.find({ organizationId: orgId }).select(
      "_id",
    );
    const projectIds = projects.map((p) => p._id);

    const completedTasks = await Task.find({
      projectId: { $in: projectIds },
      completedAt: { $exists: true, $ne: null },
      createdAt: { $exists: true },
    }).select("createdAt completedAt");

    if (completedTasks.length === 0) {
      console.log("[Analytics] No completed tasks found");
      return res.json({
        success: true,
        data: { avgDurationDays: 0, totalCompleted: 0 },
      });
    }

    const totalDuration = completedTasks.reduce((sum, task) => {
      const duration =
        (new Date(task.completedAt) - new Date(task.createdAt)) /
        (1000 * 60 * 60 * 24);
      return sum + duration;
    }, 0);

    const avgDurationDays = (totalDuration / completedTasks.length).toFixed(1);

    console.log(
      "[Analytics] Average duration:",
      avgDurationDays,
      "days from",
      completedTasks.length,
      "tasks",
    );
    res.json({
      success: true,
      data: {
        avgDurationDays: parseFloat(avgDurationDays),
        totalCompleted: completedTasks.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get extended analytics metrics (overdue, active users, velocity, health score, WoW)
// @route   GET /api/analytics/extended-metrics
// @access  Private (Admin)
const getExtendedMetrics = async (req, res) => {
  try {
    const { range = "30d" } = req.query;
    const orgId = req.user.organizationId;

    // Calculate date range
    let dateFilter = {};
    const now = new Date();

    switch (range) {
      case "7d":
        dateFilter = {
          $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        };
        break;
      case "30d":
        dateFilter = {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        };
        break;
      case "90d":
        dateFilter = {
          $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        };
        break;
      default:
        dateFilter = {}; // all time
    }

    // Get projects for organization
    const projects = await Project.find({ organizationId: orgId }).select(
      "_id",
    );
    const projectIds = projects.map((p) => p._id);

    if (projectIds.length === 0) {
      return res.json({
        success: true,
        data: {
          overdueCount: 0,
          activeUsers: 0,
          taskVelocity: 0,
          projectHealthScore: 0,
          weekOverWeekChange: 0,
        },
      });
    }

    // 1. Count overdue tasks
    const overdueCount = await Task.countDocuments({
      projectId: { $in: projectIds },
      dueDate: { $lt: new Date() },
      completedAt: { $exists: false },
    });

    // 2. Count active users (online status or last activity in last 5 minutes)
    const activeUsers = await User.countDocuments({
      organizationId: orgId,
      $or: [
        { onlineStatus: "online" },
        { lastActive: { $gt: new Date(Date.now() - 5 * 60 * 1000) } },
      ],
    });

    // 3. Calculate task velocity (tasks completed per week)
    const completedTasks = await Task.countDocuments({
      projectId: { $in: projectIds },
      completedAt: dateFilter.hasOwnProperty("$gte")
        ? dateFilter
        : { $exists: true },
    });

    function calculateWeeks(rangeParam) {
      switch (rangeParam) {
        case "7d":
          return 1;
        case "30d":
          return 4.3;
        case "90d":
          return 12.9;
        default:
          return 52;
      }
    }

    const weeks = calculateWeeks(range);
    const taskVelocity = weeks > 0 ? Math.round(completedTasks / weeks) : 0;

    // 4. Calculate project health score (0-100)
    const projectScores = [];

    for (const project of projects) {
      const projectTasks = await Task.find({ projectId: project._id }).select(
        "status completedAt dueDate currentStage",
      );

      if (projectTasks.length === 0) continue;

      // Get workflow stages to identify "done" tasks
      const doneStages = await WorkflowStage.find({
        projectId: project._id,
        isCompleteStage: true,
      }).select("_id");
      const doneStageIds = doneStages.map((s) => s._id);

      const completedCount = projectTasks.filter((t) =>
        doneStageIds.some(
          (dsId) => t.currentStage.toString() === dsId.toString(),
        ),
      ).length;

      const onTimeCount = projectTasks.filter((t) => {
        if (!t.completedAt || !t.dueDate) return false;
        return new Date(t.completedAt) <= new Date(t.dueDate);
      }).length;

      const completionRate =
        projectTasks.length > 0 ? completedCount / projectTasks.length : 0;
      const onTimeRate = completedCount > 0 ? onTimeCount / completedCount : 0;
      const score = (completionRate * 70 + onTimeRate * 30) * 100;

      projectScores.push(score);
    }

    const projectHealthScore =
      projectScores.length > 0
        ? Math.round(
            projectScores.reduce((a, b) => a + b, 0) / projectScores.length,
          )
        : 0;

    // 5. Calculate week-over-week change in completed tasks
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);

    const thisWeekCompleted = await Task.countDocuments({
      projectId: { $in: projectIds },
      completedAt: { $gte: thisWeekStart },
    });

    const lastWeekCompleted = await Task.countDocuments({
      projectId: { $in: projectIds },
      completedAt: { $gte: lastWeekStart, $lt: lastWeekEnd },
    });

    const weekOverWeekChange =
      lastWeekCompleted > 0
        ? ((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100
        : 0;

    console.log("[Analytics] Extended metrics calculated:", {
      overdueCount,
      activeUsers,
      taskVelocity,
      projectHealthScore,
      weekOverWeekChange,
    });

    res.json({
      success: true,
      data: {
        overdueCount,
        activeUsers,
        taskVelocity,
        projectHealthScore,
        weekOverWeekChange: parseFloat(weekOverWeekChange.toFixed(1)),
      },
    });
  } catch (error) {
    console.error("getExtendedMetrics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch metrics",
      data: {
        overdueCount: 0,
        activeUsers: 0,
        taskVelocity: 0,
        projectHealthScore: 0,
        weekOverWeekChange: 0,
      },
    });
  }
};

// @desc    Get Personal Performance metrics (Members)
// @route   GET /api/analytics/personal-performance
// @access  Private (All)
const getPersonalPerformance = async (req, res) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organizationId;
    
    // Performance metrics over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tasksCompleted = await Task.countDocuments({
      assignedTo: userId,
      completedAt: { $gte: thirtyDaysAgo }
    });

    const activeTasks = await Task.countDocuments({
      assignedTo: userId,
      completedAt: { $exists: false }
    });

    // AI Prioritization Logic (simplified version for now)
    const priorityTasks = await Task.find({
      assignedTo: userId,
      completedAt: { $exists: false }
    })
    .sort({ dueDate: 1, priority: -1 })
    .limit(3)
    .populate('currentStage', 'name');

    // Velocity Trend (completed per week)
    const velocityData = [];
    for (let i = 3; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - (i * 7));
      const start = new Date(end);
      start.setDate(start.getDate() - 7);

      const count = await Task.countDocuments({
        assignedTo: userId,
        completedAt: { $gte: start, $lt: end }
      });

      velocityData.push({
        week: `Week ${4-i}`,
        completed: count
      });
    }

    res.json({
      success: true,
      data: {
        metrics: {
          completedLastMonth: tasksCompleted,
          activeTasks,
          completionRate: activeTasks > 0 ? Math.round((tasksCompleted / (tasksCompleted + activeTasks)) * 100) : 100,
        },
        aiInsights: {
          nextBestTask: priorityTasks[0] || null,
          recommendedFocus: priorityTasks.length > 3 ? "Consolidate ongoing tasks before picking up new ones." : "You have capacity for new challenges.",
          efficiencyScore: 85 + (tasksCompleted > 5 ? 10 : 0) // Mock score
        },
        velocityTrend: velocityData,
        topPriorities: priorityTasks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWorkload,
  getBottlenecks,
  getOverview,
  getTeamProductivity,
  getProjectInsights,
  getRecentActivities,
  getTasksByStatus,
  getProjectProgress,
  getAvgDuration,
  getExtendedMetrics,
  getPersonalPerformance,
};
