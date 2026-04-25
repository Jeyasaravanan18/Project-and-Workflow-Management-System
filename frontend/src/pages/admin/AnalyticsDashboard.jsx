import { useEffect, useState, useRef, useCallback } from "react";
import api from "../../services/api";
import AnalyticsChart from "../../components/AnalyticsChart";
import RealtimeActivityFeed from "../../components/RealtimeActivityFeed";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Download,
  FileText,
  Table2,
  Calendar,
  Filter,
  ArrowRight,
  Users,
  AlertTriangle,
  ChevronDown,
  Loader,
} from "lucide-react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("30d");
  const [showBottlenecks, setShowBottlenecks] = useState(false);
  const [bottleneckThreshold, setBottleneckThreshold] = useState(7);
  const [exportLoading, setExportLoading] = useState(null); // 'tasks-csv' | 'tasks-xlsx' | 'analytics-csv' | 'analytics-xlsx'
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);
  const socket = useSocket();
  const hasFetchedRef = useRef(false); // Prevent duplicate calls in StrictMode
  const [data, setData] = useState({
    tasksByStatus: [],
    projectProgress: [],
    taskCompletionRate: 0,
    avgTaskDuration: 0,
    overdueCount: 0,
    activeUsers: 0,
    taskVelocity: 0,
    projectHealthScore: 0,
    weekOverWeekChange: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
  });

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [statusRes, progressRes, durationRes, metricsRes] =
        await Promise.all([
          api.get("/analytics/tasks-by-status").catch((err) => {
            console.error("[AnalyticsDashboard] tasks-by-status error:", err);
            return { data: { success: true, data: [] } };
          }),
          api.get("/analytics/project-progress").catch((err) => {
            console.error("[AnalyticsDashboard] project-progress error:", err);
            return { data: { success: true, data: [] } };
          }),
          api.get("/analytics/avg-duration").catch((err) => {
            console.error("[AnalyticsDashboard] avg-duration error:", err);
            return { data: { success: true, data: { avgDurationDays: 0 } } };
          }),
          api
            .get("/analytics/extended-metrics", {
              params: { range: dateRange },
            })
            .catch((err) => {
              console.error(
                "[AnalyticsDashboard] extended-metrics error:",
                err,
              );
              return {
                data: {
                  success: true,
                  data: {
                    overdueCount: 0,
                    activeUsers: 0,
                    taskVelocity: 0,
                    projectHealthScore: 0,
                    weekOverWeekChange: 0,
                  },
                },
              };
            }),
        ]);

      // Extract data from standardized response format
      const tasksByStatus = statusRes.data?.data || statusRes.data || [];
      const projectProgress = progressRes.data?.data || progressRes.data || [];
      const durationResponse = durationRes.data?.data || durationRes.data || {};
      const metricsData = metricsRes.data?.data || metricsRes.data || {};

      const totalTasks = Array.isArray(tasksByStatus)
        ? tasksByStatus.reduce((acc, curr) => acc + (curr.count || 0), 0)
        : 0;
      const completedTasksCount = Array.isArray(tasksByStatus)
        ? tasksByStatus.find(
            (s) =>
              s.status?.toLowerCase().includes("done") ||
              s.status?.toLowerCase().includes("completed"),
          )?.count || 0
        : 0;

      const inProgressCount = Array.isArray(tasksByStatus)
        ? tasksByStatus.find(
            (s) =>
              s.status?.toLowerCase().includes("progress") ||
              s.status?.toLowerCase().includes("doing"),
          )?.count || 0
        : 0;

      const pendingCount = Array.isArray(tasksByStatus)
        ? tasksByStatus.find(
            (s) =>
              s.status?.toLowerCase().includes("backlog") ||
              s.status?.toLowerCase().includes("pending") ||
              s.status?.toLowerCase().includes("to do") ||
              s.status?.toLowerCase().includes("todo"),
          )?.count || 0
        : 0;

      setData({
        tasksByStatus: Array.isArray(tasksByStatus) ? tasksByStatus : [],
        projectProgress: Array.isArray(projectProgress) ? projectProgress : [],
        taskCompletionRate:
          totalTasks > 0
            ? Math.round((completedTasksCount / totalTasks) * 100)
            : 0,
        avgTaskDuration: durationResponse.avgDurationDays || 0,
        completedTasks: completedTasksCount,
        inProgressTasks: inProgressCount,
        pendingTasks: pendingCount,
        overdueCount: metricsData.overdueCount || 0,
        activeUsers: metricsData.activeUsers || 0,
        taskVelocity: metricsData.taskVelocity || 0,
        projectHealthScore: metricsData.projectHealthScore || 0,
        weekOverWeekChange: metricsData.weekOverWeekChange || 0,
      });
    } catch (error) {
      console.error("Analytics fetch error:", error);
      // Set safe empty defaults on error
      setData((prev) => ({
        ...prev,
        tasksByStatus: [],
        projectProgress: [],
        taskCompletionRate: 0,
        avgTaskDuration: 0,
      }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchData();
  }, []);

  // Refetch when date range changes
  useEffect(() => {
    if (hasFetchedRef.current) {
      fetchData();
    }
  }, [dateRange]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      console.log("🔄 Analytics update received via socket");
      fetchData();
    };

    socket.on("task:created", handleUpdate);
    socket.on("task:updated", handleUpdate);
    socket.on("task:deleted", handleUpdate);
    socket.on("project:created", handleUpdate);
    socket.on("project:updated", handleUpdate);

    return () => {
      socket.off("task:created", handleUpdate);
      socket.off("task:updated", handleUpdate);
      socket.off("task:deleted", handleUpdate);
      socket.off("project:created", handleUpdate);
      socket.off("project:updated", handleUpdate);
    };
  }, [socket]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <Container>
        <Loading>
          <Spinner />
          <p>Loading analytics...</p>
        </Loading>
      </Container>
    );
  }

  const totalTasks = data.tasksByStatus.reduce(
    (acc, curr) => acc + curr.count,
    0,
  );

  // Check for bottlenecks
  const hasBottlenecks = data.avgTaskDuration > bottleneckThreshold;

  // ── Export Helpers ──────────────────────────────────────────────────────────
  const triggerDownload = (blobData, filename, mimeType) => {
    const blob = new Blob([blobData], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  };

  const handleExport = async (endpoint, format) => {
    const key = `${endpoint}-${format}`;
    try {
      setExportLoading(key);
      setExportDropdownOpen(false);
      const mimeType = format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv';
      const filename = `${endpoint}-export-${new Date().toISOString().split('T')[0]}.${format}`;
      const response = await api.get(`/export/${endpoint}`, {
        params: { format },
        responseType: 'blob',
      });
      triggerDownload(response.data, filename, mimeType);
    } catch (err) {
      console.error(`[Export] Failed to export ${endpoint} as ${format}:`, err);
      alert(`Export failed. Please try again.`);
    } finally {
      setExportLoading(null);
    }
  };

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderLeft>
          <Title>Analytics Dashboard</Title>
          <Subtitle>Comprehensive performance insights and metrics</Subtitle>
        </HeaderLeft>
        <HeaderActions>
          <DateFilter>
            <Calendar size={16} />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </DateFilter>
          {/* Export Dropdown */}
          <ExportDropdownWrapper ref={exportDropdownRef}>
            <ExportButton
              onClick={() => setExportDropdownOpen((o) => !o)}
              disabled={exportLoading !== null}
            >
              {exportLoading ? (
                <SpinnerSmall />
              ) : (
                <Download size={16} />
              )}
              Export
              <ChevronDown size={14} style={{ marginLeft: 2, opacity: 0.7 }} />
            </ExportButton>
            {exportDropdownOpen && (
              <ExportDropdownMenu>
                <ExportDropdownLabel>Tasks</ExportDropdownLabel>
                <ExportDropdownItem
                  onClick={() => handleExport('tasks', 'xlsx')}
                  $active={exportLoading === 'tasks-xlsx'}
                >
                  <Table2 size={15} />
                  Export Tasks as Excel
                  <ExportBadge $color="#22c55e">XLSX</ExportBadge>
                </ExportDropdownItem>
                <ExportDropdownItem
                  onClick={() => handleExport('tasks', 'csv')}
                  $active={exportLoading === 'tasks-csv'}
                >
                  <FileText size={15} />
                  Export Tasks as CSV
                  <ExportBadge $color="#64748b">CSV</ExportBadge>
                </ExportDropdownItem>
                <ExportDropdownSeparator />
                <ExportDropdownLabel>Analytics</ExportDropdownLabel>
                <ExportDropdownItem
                  onClick={() => handleExport('analytics', 'xlsx')}
                  $active={exportLoading === 'analytics-xlsx'}
                >
                  <Table2 size={15} />
                  Export Analytics as Excel
                  <ExportBadge $color="#22c55e">XLSX</ExportBadge>
                </ExportDropdownItem>
                <ExportDropdownItem
                  onClick={() => handleExport('analytics', 'csv')}
                  $active={exportLoading === 'analytics-csv'}
                >
                  <FileText size={15} />
                  Export Analytics as CSV
                  <ExportBadge $color="#64748b">CSV</ExportBadge>
                </ExportDropdownItem>
              </ExportDropdownMenu>
            )}
          </ExportDropdownWrapper>
          <RefreshButton onClick={fetchData} disabled={refreshing}>
            <RefreshCw size={18} className={refreshing ? "spin" : ""} />
            Refresh
          </RefreshButton>
        </HeaderActions>
      </Header>

      {/* Bottleneck Alert */}
      {hasBottlenecks && (
        <RichNotification>
          <NotificationIcon>
            <AlertCircle size={24} />
          </NotificationIcon>
          <NotificationContent>
            <h4>Bottleneck Detected</h4>
            <p>
              Average task duration ({data.avgTaskDuration}d) exceeds threshold
              ({bottleneckThreshold}d)
            </p>
          </NotificationContent>
          <NotificationAction
            onClick={() => navigate("/analytics/bottlenecks")}
          >
            View Analysis
            <ArrowRight size={16} />
          </NotificationAction>
        </RichNotification>
      )}

      {/* Overdue Alert - NEW */}
      {data.overdueCount > 0 && (
        <OverdueNotification>
          <NotificationIcon style={{ background: "#fef3c7", color: "#eab308" }}>
            <AlertTriangle size={24} />
          </NotificationIcon>
          <NotificationContent>
            <h4>⚠️ {data.overdueCount} Overdue Tasks</h4>
            <p>
              These tasks have exceeded their due dates. Immediate action
              needed.
            </p>
          </NotificationContent>
          <NotificationAction
            onClick={() => navigate("/admin/tasks?filter=overdue")}
            style={{ background: "#eab308" }}
          >
            View Overdue
            <ArrowRight size={16} />
          </NotificationAction>
        </OverdueNotification>
      )}

      {/* KPI Cards */}
      <KPIGrid>
        <KPICard $delay={0} color="#22c55e" className="glass-card">
          <KPIIcon>
            <CheckCircle2 size={32} />
          </KPIIcon>
          <KPIContent>
            <KPIValue>{data.completedTasks}</KPIValue>
            <KPILabel>Completed Tasks</KPILabel>
            <KPITrend $positive={data.weekOverWeekChange >= 0}>
              {data.weekOverWeekChange >= 0 ? "↑" : "↓"}{" "}
              {data.taskCompletionRate}% rate
            </KPITrend>
            <TrendIndicator $positive={data.weekOverWeekChange >= 0}>
              WoW: {Math.abs(data.weekOverWeekChange).toFixed(1)}%
            </TrendIndicator>
          </KPIContent>
        </KPICard>

        <KPICard $delay={0.1} color="#f97316" className="glass-card">
          <KPIIcon>
            <Activity size={32} />
          </KPIIcon>
          <KPIContent>
            <KPIValue>{data.inProgressTasks}</KPIValue>
            <KPILabel>In Progress</KPILabel>
            <KPITrend>Active work items</KPITrend>
          </KPIContent>
        </KPICard>

        <KPICard $delay={0.2} color="#64748b" className="glass-card">
          <KPIIcon>
            <Clock size={32} />
          </KPIIcon>
          <KPIContent>
            <KPIValue>{data.pendingTasks}</KPIValue>
            <KPILabel>Pending Tasks</KPILabel>
            <KPITrend>Awaiting assignment</KPITrend>
          </KPIContent>
        </KPICard>

        <KPICard $delay={0.3} color="#475569" className="glass-card">
          <KPIIcon>
            <TrendingUp size={32} />
          </KPIIcon>
          <KPIContent>
            <KPIValue>{data.avgTaskDuration}d</KPIValue>
            <KPILabel>Avg. Duration</KPILabel>
            <KPITrend>Task completion time</KPITrend>
          </KPIContent>
        </KPICard>
      </KPIGrid>

      {/* Extended Metrics Grid - NEW */}
      <ExtendedMetricsGrid>
        <MetricCard $delay={0.4}>
          <MetricIcon style={{ background: "#fee2e2", color: "#ef4444" }}>
            <AlertTriangle size={24} />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{data.overdueCount}</MetricValue>
            <MetricLabel>Overdue Tasks</MetricLabel>
          </MetricContent>
        </MetricCard>

        <MetricCard $delay={0.5}>
          <MetricIcon style={{ background: "#dbeafe", color: "#3b82f6" }}>
            <Users size={24} />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{data.activeUsers}</MetricValue>
            <MetricLabel>Active Users</MetricLabel>
          </MetricContent>
        </MetricCard>

        <MetricCard $delay={0.6}>
          <MetricIcon style={{ background: "#d1fae5", color: "#10b981" }}>
            <TrendingUp size={24} />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{data.taskVelocity}</MetricValue>
            <MetricLabel>Tasks/Week</MetricLabel>
          </MetricContent>
        </MetricCard>

        <MetricCard $delay={0.7}>
          <MetricIcon style={{ background: "#f3e8ff", color: "#a855f7" }}>
            <Activity size={24} />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{data.projectHealthScore}%</MetricValue>
            <MetricLabel>Health Score</MetricLabel>
          </MetricContent>
        </MetricCard>
      </ExtendedMetricsGrid>

      {/* Charts Grid */}
      <ChartsGrid>
        {/* Task Distribution */}
        <ChartCard $delay={0.4} className="glass-card">
          <ChartHeader>
            <PieChart size={20} />
            <h3>Task Distribution</h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              (Data length: {data.tasksByStatus.length})
            </span>
          </ChartHeader>
          {data.tasksByStatus.length > 0 ? (
            <ChartWrapper onClick={() => navigate("/admin/tasks")}>
              <AnalyticsChart
                data={data.tasksByStatus.map((item) => ({
                  name: item.status,
                  value: Number(item.count || 0),
                }))}
                type="pie"
                dataKey="value"
                categoryKey="name"
                colors={["#22c55e", "#f97316", "#64748b", "#ef4444"]}
              />
              <ChartHint>Click to view all tasks</ChartHint>
            </ChartWrapper>
          ) : (
            <EmptyChart>
              <PieChart size={48} />
              <p>No task data available</p>
              <p
                style={{ fontSize: "12px", marginTop: "8px", color: "#94a3b8" }}
              >
                Create tasks to see distribution
              </p>
            </EmptyChart>
          )}
        </ChartCard>

        {/* Real-Time Activity Feed */}
        <RealtimeActivityFeed limit={15} />
      </ChartsGrid>

      {/* Project Progress Table */}
      <TableCard $delay={0.6}>
        <ChartHeader>
          <Activity size={20} />
          <h3>Project Progress</h3>
        </ChartHeader>
        {data.projectProgress.length > 0 ? (
          <ProgressTable>
            <thead>
              <tr>
                <th>Project</th>
                <th>Tasks</th>
                <th>Completion</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {data.projectProgress.map((project, index) => {
                const completionRate =
                  project.totalTasks > 0
                    ? Math.round(
                        (project.completedTasks / project.totalTasks) * 100,
                      )
                    : 0;
                return (
                  <tr key={index}>
                    <td>
                      <strong>{project.project}</strong>
                    </td>
                    <td>
                      {project.completedTasks} / {project.totalTasks}
                    </td>
                    <td>
                      <CompletionBadge $rate={completionRate}>
                        {completionRate}%
                      </CompletionBadge>
                    </td>
                    <td>
                      <ProgressBar>
                        <ProgressFill $width={completionRate} />
                      </ProgressBar>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </ProgressTable>
        ) : (
          <EmptyState>
            <Activity size={48} />
            <p>No project data available</p>
          </EmptyState>
        )}
      </TableCard>
    </Container>
  );
};

// Animations
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

const rotate = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const fillProgress = keyframes`
    from { width: 0; }
`;

// Styled Components
const Container = styled.div`
  padding: 48px;
  background: #f4f4f4; /* Carbon Gray 10 */
  min-height: 100vh;
  max-width: 1600px;
  margin: 0 auto;
  font-family: 'IBM Plex Sans', sans-serif;
`;

const Loading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  color: #525252;
  p {
    margin-top: 20px;
    font-size: 0.875rem;
  }
`;

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top-color: #0f62fe;
  animation: ${rotate} 0.8s linear infinite;
`;

const SpinnerSmall = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #e0e0e0;
  border-top-color: #0f62fe;
  animation: ${rotate} 0.7s linear infinite;
  flex-shrink: 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;
  animation: ${fadeIn} 0.4s ease-out;
`;

const HeaderLeft = styled.div``;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 300; /* Carbon Light weight for large titles */
  color: #161616;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #525252;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const DateFilter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  background: white;
  border: 1px solid #e0e0e0;
  height: 48px;

  select {
    border: none;
    background: none;
    font-size: 0.875rem;
    color: #161616;
    cursor: pointer;
    outline: none;
    font-weight: 400;
  }

  svg {
    color: #525252;
  }
`;

const ExportDropdownWrapper = styled.div`
  position: relative;
`;

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  background: white;
  color: #161616;
  border: 1px solid #e0e0e0;
  height: 48px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #f4f4f4;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const dropdownFade = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ExportDropdownMenu = styled.div`
  position: absolute;
  top: 48px;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 240px;
  z-index: 1000;
  padding: 8px 0;
  animation: ${dropdownFade} 0.2s ease-out;
`;

const ExportDropdownLabel = styled.div`
  padding: 8px 16px;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #525252;
`;

const ExportDropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #161616;
  font-size: 0.8125rem;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: #f4f4f4;
  }

  svg {
    color: #525252;
    flex-shrink: 0;
  }
`;

const ExportDropdownSeparator = styled.div`
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
`;

const ExportBadge = styled.span`
  margin-left: auto;
  padding: 2px 6px;
  font-size: 0.625rem;
  font-weight: 600;
  background: #f4f4f4;
  color: #525252;
  border: 1px solid #e0e0e0;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 24px;
  background: #0f62fe;
  color: white;
  border: none;
  height: 48px;
  font-size: 0.875rem;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #0043ce;
  }

  &:disabled {
    background: #c6c6c6;
    cursor: not-allowed;
  }

  .spin {
    animation: ${rotate} 0.8s linear infinite;
  }
`;

const pulse = keyframes`
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
`;

const RichNotification = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 24px;
  background: white;
  border: 1px solid #e0e0e0;
  border-left: 4px solid #da1e28; /* Carbon Red 60 */
  margin-bottom: 32px;
  animation: ${fadeIn} 0.4s ease-out;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`;

const OverdueNotification = styled(RichNotification)`
  border-left-color: #f1c21b; /* Carbon Yellow 30 */
`;

const NotificationIcon = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #da1e28;
  flex-shrink: 0;
`;

const NotificationContent = styled.div`
  flex: 1;

  h4 {
    margin: 0 0 4px;
    color: #161616;
    font-size: 0.875rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: #525252;
    font-size: 0.875rem;
    line-height: 1.4;
  }
`;

const NotificationAction = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  background: #161616;
  color: white;
  border: none;
  height: 32px;
  font-weight: 400;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #393939;
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const ChartHint = styled.div`
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 4px 12px;
  background: rgba(71, 85, 105, 0.9);
  color: white;
  font-size: 0.75rem;
  border-radius: 6px;
  opacity: 0;
  transition: opacity 0.3s ease;
`;

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px; /* Carbon-style grid line */
  background: #e0e0e0;
  border: 1px solid #e0e0e0;
  margin-bottom: 32px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const KPICard = styled.div`
  background: white;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: ${fadeIn} 0.4s ease-out;
  animation-delay: ${(props) => props.$delay}s;
  opacity: 0;
  animation-fill-mode: forwards;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: ${(props) => props.color};
  }
`;

const KPIIcon = styled.div`
  color: ${(props) => props.theme.text.secondary};
`;

const KPIContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const KPIValue = styled.div`
  font-size: 2.5rem;
  font-weight: 300;
  color: #161616;
  line-height: 1;
  margin-bottom: 8px;
`;

const KPILabel = styled.div`
  font-size: 0.8125rem;
  font-weight: 600;
  color: #525252;
  margin-bottom: 4px;
`;

const KPITrend = styled.div`
  font-size: 0.75rem;
  color: ${(props) =>
    props.$positive ? "#24a148" : "#525252"};
  font-weight: 400;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: white;
  padding: 24px;
  border: 1px solid #e0e0e0;
  animation: ${fadeIn} 0.4s ease-out;
  animation-delay: ${(props) => props.$delay}s;
  opacity: 0;
  animation-fill-mode: forwards;
`;

const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #161616;
  }

  svg {
    color: #525252;
  }
`;

const ChartWrapper = styled.div`
  height: 300px;
  position: relative;
  cursor: pointer;

  &:hover {
    ${ChartHint} {
      opacity: 1;
    }
  }
`;

const EmptyChart = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${(props) => props.theme.text.tertiary};

  svg {
    margin: 0 auto 16px;
  }

  p {
    color: ${(props) => props.theme.text.secondary};
    font-size: 0.875rem;
  }
`;

const TableCard = styled.div`
  background: white;
  padding: 24px;
  border: 1px solid #e0e0e0;
  animation: ${fadeIn} 0.4s ease-out;
  animation-delay: ${(props) => props.$delay}s;
  opacity: 0;
  animation-fill-mode: forwards;
`;

const ProgressTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead {
    th {
      text-align: left;
      padding: 12px 16px;
      background: #f4f4f4;
      border-bottom: 1px solid #e0e0e0;
      font-size: 0.75rem;
      font-weight: 600;
      color: #525252;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #e0e0e0;

      &:hover {
        background: #f4f4f4;
      }

      &:last-child {
        border-bottom: none;
      }

      td {
        padding: 16px;
        font-size: 0.8125rem;
        color: #161616;
      }
    }
  }
`;

const CompletionBadge = styled.span`
  padding: 2px 8px;
  font-size: 0.75rem;
  font-weight: 400;
  background: #f4f4f4;
  color: #161616;
  border: 1px solid #e0e0e0;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #e0e0e0;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${(props) => props.$width}%;
  background: #0f62fe;
  transition: width 1s ease-out;
  animation: ${fillProgress} 1.4s ease-out;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 24px;
  color: ${(props) => props.theme.text.tertiary};

  svg {
    color: ${(props) => props.theme.text.tertiary};
    margin-bottom: 16px;
  }

  p {
    font-size: 0.875rem;
  }
`;

const TrendIndicator = styled.div`
  font-size: 0.625rem;
  color: #525252;
  font-weight: 400;
  margin-top: 8px;
  padding: 2px 8px;
  background: #f4f4f4;
  border: 1px solid #e0e0e0;
  width: fit-content;
`;

const ExtendedMetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const MetricCard = styled.div`
  background: white;
  padding: 16px;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: ${fadeIn} 0.4s ease-out;
  animation-delay: ${(props) => props.$delay}s;
  opacity: 0;
  animation-fill-mode: forwards;
`;

const MetricIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f4f4f4 !important;
  color: #525252 !important;
`;

const MetricContent = styled.div`
  flex: 1;
`;

const MetricValue = styled.div`
  font-size: 1.25rem;
  font-weight: 400;
  color: #161616;
  line-height: 1.2;
`;

const MetricLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 400;
  color: #525252;
`;

export default AnalyticsDashboard;
