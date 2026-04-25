// Enhanced AnalyticsDashboard with missing metrics and fixes (REPLACE the existing file)
import React, { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import {
  Calendar,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle2,
  Activity,
  Clock,
  TrendingUp,
  ArrowRight,
  PieChart,
  Users,
  AlertTriangle,
} from "lucide-react";
import AnalyticsChart from "../../components/AnalyticsChart";
import RealtimeActivityFeed from "../../components/RealtimeActivityFeed";
import io from "socket.io-client";

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
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
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("30d");
  const socketRef = useRef(null);
  const [bottleneckThreshold, setBottleneckThreshold] = useState(7);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, progressRes, durationRes, metricsRes] =
        await Promise.all([
          api.get("/analytics/tasks-by-status", {
            params: { range: dateRange },
          }),
          api.get("/analytics/project-progress", {
            params: { range: dateRange },
          }),
          api.get("/analytics/avg-duration", { params: { range: dateRange } }),
          api.get("/analytics/extended-metrics", {
            params: { range: dateRange },
          }),
        ]);

      const tasksByStatus = statusRes.data?.data || statusRes.data || [];
      const projectProgress = progressRes.data?.data || progressRes.data || [];
      const avgDuration = durationRes.data?.data?.avgDuration || 0;

      // Extract extended metrics with fallback
      const metrics = metricsRes.data?.data || {};

      // Calculate completionRate from status data
      const completedCount =
        tasksByStatus.find((s) => s.status === "Done")?.count || 0;
      const totalCount = tasksByStatus.reduce(
        (sum, s) => sum + (s.count || 0),
        0,
      );
      const completionRate =
        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      // Get individual status counts
      const inProgressCount =
        tasksByStatus.find((s) => s.status === "In Progress")?.count || 0;
      const pendingCount =
        tasksByStatus.find((s) => s.status === "Pending")?.count || 0;

      setData({
        tasksByStatus: Array.isArray(tasksByStatus) ? tasksByStatus : [],
        projectProgress: Array.isArray(projectProgress) ? projectProgress : [],
        taskCompletionRate: completionRate,
        avgTaskDuration: Math.round(avgDuration * 10) / 10,
        inProgressCount,
        completedCount,
        pendingCount,
        overdueCount: metrics.overdueCount || 0,
        activeUsers: metrics.activeUsers || 0,
        taskVelocity: metrics.taskVelocity || 0,
        projectHealthScore: metrics.projectHealthScore || 0,
        weekOverWeekChange: metrics.weekOverWeekChange || 0,
      });
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setData((prev) => ({
        ...prev,
        tasksByStatus: [],
        projectProgress: [],
        taskCompletionRate: 0,
        avgTaskDuration: 0,
        overdueCount: 0,
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup Socket.IO for real-time updates
    socketRef.current = io();
    socketRef.current.on("task:created", () => {
      setRefreshing(true);
      setTimeout(() => {
        fetchData();
        setRefreshing(false);
      }, 1000);
    });
    socketRef.current.on("task:updated", () => {
      setRefreshing(true);
      setTimeout(() => {
        fetchData();
        setRefreshing(false);
      }, 1000);
    });
    socketRef.current.on("task:deleted", () => {
      setRefreshing(true);
      setTimeout(() => {
        fetchData();
        setRefreshing(false);
      }, 1000);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [dateRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const exportToCSV = () => {
    const csvData = [
      ["Project", "Total Tasks", "Completed Tasks", "Completion Rate"],
      ...data.projectProgress.map((p) => [
        p.project,
        p.totalTasks,
        p.completedTasks,
        `${((p.completedTasks / p.totalTasks) * 100).toFixed(1)}%`,
      ]),
    ];
    const csv = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics_${new Date().toISOString()}.csv`;
    link.click();
  };

  // Improved bottleneck detection
  const hasBottlenecks = data.avgTaskDuration > bottleneckThreshold;

  if (loading) {
    return (
      <Container>
        <Loading>
          <Spinner />
          <p>Loading analytics data...</p>
        </Loading>
      </Container>
    );
  }

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
          <ExportButton onClick={exportToCSV}>
            <Download size={16} />
            Export CSV
          </ExportButton>
          <RefreshButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={18} className={refreshing ? "spin" : ""} />
            Refresh
          </RefreshButton>
        </HeaderActions>
      </Header>

      {/* Bottleneck Alert - FIXED: No debug code */}
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

      {/* Overdue Alert - NEW FEATURE */}
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

      {/* Main KPI Cards */}
      <KPIGrid>
        <KPICard $delay={0} color="#22c55e">
          <KPIIcon>
            <CheckCircle2 size={32} />
          </KPIIcon>
          <KPIContent>
            <KPIValue>{data.completedCount}</KPIValue>
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

        <KPICard $delay={0.1} color="#f97316">
          <KPIIcon>
            <Activity size={32} />
          </KPIIcon>
          <KPIContent>
            <KPIValue>{data.inProgressCount}</KPIValue>
            <KPILabel>In Progress</KPILabel>
            <KPITrend>Active work items</KPITrend>
          </KPIContent>
        </KPICard>

        <KPICard $delay={0.2} color="#64748b">
          <KPIIcon>
            <Clock size={32} />
          </KPIIcon>
          <KPIContent>
            <KPIValue>{data.pendingCount}</KPIValue>
            <KPILabel>Pending Tasks</KPILabel>
            <KPITrend>Awaiting assignment</KPITrend>
          </KPIContent>
        </KPICard>

        <KPICard $delay={0.3} color="#475569">
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

      {/* NEW: Extended Metrics Row */}
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
        {/* Task Distribution - FIXED: Removed debug code */}
        <ChartCard $delay={0.4}>
          <ChartHeader>
            <PieChart size={20} />
            <h3>Task Distribution</h3>
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
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const rotate = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const fillProgress = keyframes`
    from { width: 0; }
`;

const pulse = keyframes`
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
`;

// Styled Components
const Container = styled.div`
  padding: 32px;
  background: ${(props) => props.theme.bg.primary};
  min-height: 100vh;
  max-width: 1600px;
  margin: 0 auto;
`;

const Loading = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  color: ${(props) => props.theme.text.secondary};
  p {
    margin-top: 20px;
  }
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid ${(props) => props.theme.border};
  border-top-color: ${(props) => props.theme.text.secondary};
  border-radius: 50%;
  animation: ${rotate} 1s linear infinite;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  animation: ${fadeIn} 0.5s ease-out;
`;

const HeaderLeft = styled.div``;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${(props) => props.theme.text.primary};
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: ${(props) => props.theme.text.secondary};
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
  padding: 10px 16px;
  background: ${(props) => props.theme.bg.card};
  border: 2px solid ${(props) => props.theme.border};
  border-radius: 10px;

  select {
    border: none;
    background: none;
    font-weight: 600;
    color: ${(props) => props.theme.text.secondary};
    cursor: pointer;
    outline: none;
  }
`;

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: ${(props) => props.theme.bg.card};
  color: ${(props) => props.theme.text.secondary};
  border: 2px solid ${(props) => props.theme.border};
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => props.theme.bg.hover};
    border-color: ${(props) => props.theme.text.tertiary};
    transform: translateY(-2px);
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: ${(props) =>
    props.theme.mode === "dark" ? props.theme.bg.card : "#475569"};
  color: ${(props) =>
    props.theme.mode === "dark" ? props.theme.text.primary : "white"};
  border: ${(props) =>
    props.theme.mode === "dark" ? `1px solid ${props.theme.border}` : "none"};
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(71, 85, 105, 0.2);

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.theme.mode === "dark" ? props.theme.bg.hover : "#334155"};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(71, 85, 105, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spin {
    animation: ${rotate} 1s linear infinite;
  }
`;

const RichNotification = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 32px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 20px;
  margin-bottom: 32px;
  animation: ${fadeIn} 0.5s ease-out;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`;

const OverdueNotification = styled(RichNotification)`
  background: #fffbeb;
  border-color: #feddae;
`;

const NotificationIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
  animation: ${pulse} 2s infinite;
  flex-shrink: 0;
`;

const NotificationContent = styled.div`
  flex: 1;
  z-index: 1;

  h4 {
    margin: 0 0 8px;
    color: #991b1b;
    font-size: 1.125rem;
    font-weight: 700;
  }

  p {
    margin: 0;
    color: #b91c1c;
    font-size: 0.9375rem;
    line-height: 1.5;
  }
`;

const NotificationAction = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.3);
    background: #dc2626;
  }
`;

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const KPICard = styled.div`
  background: ${(props) => props.theme.bg.card};
  border-radius: 16px;
  padding: 24px;
  border-left: 4px solid ${(props) => props.color};
  border: 1px solid ${(props) => props.theme.border};
  border-left-width: 4px;
  box-shadow: ${(props) => props.theme.shadow.sm};
  display: flex;
  gap: 16px;
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.5s ease-out;
  animation-delay: ${(props) => props.$delay}s;
  opacity: 0;
  animation-fill-mode: forwards;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${(props) => props.theme.shadow.lg};
  }
`;

const KPIIcon = styled.div`
  color: ${(props) => props.theme.text.secondary};
`;

const KPIContent = styled.div`
  flex: 1;
`;

const KPIValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${(props) => props.theme.text.primary};
  line-height: 1;
  margin-bottom: 8px;
`;

const KPILabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) => props.theme.text.secondary};
  margin-bottom: 4px;
`;

const KPITrend = styled.div`
  font-size: 0.75rem;
  color: ${(props) =>
    props.$positive ? "#22c55e" : props.theme.text.tertiary};
  font-weight: 500;
`;

const TrendIndicator = styled.div`
  font-size: 0.7rem;
  color: ${(props) => (props.$positive ? "#22c55e" : "#ef4444")};
  font-weight: 600;
  margin-top: 4px;
  padding: 2px 6px;
  background: ${(props) => (props.$positive ? "#dcfce7" : "#fee2e2")};
  border-radius: 4px;
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
  background: ${(props) => props.theme.bg.card};
  border-radius: 12px;
  padding: 16px;
  border: 1px solid ${(props) => props.theme.border};
  display: flex;
  align-items: center;
  gap: 12px;
  animation: ${fadeIn} 0.5s ease-out;
  animation-delay: ${(props) => props.$delay}s;
  opacity: 0;
  animation-fill-mode: forwards;
`;

const MetricIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const MetricContent = styled.div`
  flex: 1;
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(props) => props.theme.text.primary};
  line-height: 1;
  margin-bottom: 4px;
`;

const MetricLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${(props) => props.theme.text.secondary};
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
  background: ${(props) => props.theme.bg.card};
  border-radius: 16px;
  padding: 24px;
  border: 1px solid ${(props) => props.theme.border};
  box-shadow: ${(props) => props.theme.shadow.sm};
  animation: ${fadeIn} 0.5s ease-out;
  animation-delay: ${(props) => props.$delay}s;
  opacity: 0;
  animation-fill-mode: forwards;
`;

const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;

  h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: ${(props) => props.theme.text.primary};
  }

  svg {
    color: ${(props) => props.theme.text.secondary};
  }
`;

const ChartWrapper = styled.div`
  height: 300px;
  position: relative;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.02);

    & ${ChartHint} {
      opacity: 1;
    }
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
  background: ${(props) => props.theme.bg.card};
  border-radius: 16px;
  padding: 24px;
  border: 1px solid ${(props) => props.theme.border};
  box-shadow: ${(props) => props.theme.shadow.sm};
  animation: ${fadeIn} 0.5s ease-out;
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
      background: ${(props) => props.theme.bg.tertiary};
      border-bottom: 2px solid ${(props) => props.theme.border};
      font-size: 0.75rem;
      font-weight: 700;
      color: ${(props) => props.theme.text.secondary};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid ${(props) => props.theme.border};
      transition: background 0.2s ease;

      &:hover {
        background: ${(props) => props.theme.bg.hover};
      }

      &:last-child {
        border-bottom: none;
      }

      td {
        padding: 16px;
        font-size: 0.875rem;
        color: ${(props) => props.theme.text.secondary};
      }
    }
  }
`;

const CompletionBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  background: ${(props) => {
    if (props.$rate >= 80) return "#22c55e20";
    if (props.$rate >= 50) return "#f9731620";
    return "#64748b20";
  }};
  color: ${(props) => {
    if (props.$rate >= 80) return "#22c55e";
    if (props.$rate >= 50) return "#f97316";
    return "#64748b";
  }};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${(props) => props.theme.bg.tertiary};
  border-radius: 10px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${(props) => props.$width}%;
  background: linear-gradient(90deg, #475569 0%, #64748b 100%);
  border-radius: 10px;
  transition: width 1s ease-out;
  animation: ${fillProgress} 1s ease-out;
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

export default AnalyticsDashboard;
