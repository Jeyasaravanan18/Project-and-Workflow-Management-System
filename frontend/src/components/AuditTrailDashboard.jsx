import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import styled, { keyframes } from "styled-components";
import {
  Shield,
  Download,
  Filter,
  Search,
  AlertTriangle,
  User,
  Calendar,
  Activity,
  ChevronDown,
  FileText,
  Lock,
} from "lucide-react";

const AuditTrailDashboard = ({ onViewDetails }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: "",
    actionType: "",
    entityType: "",
    startDate: "",
    endDate: "",
    page: 1,
  });
  const [pagination, setPagination] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [securitySummary, setSecuritySummary] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const hasFetchedRef = useRef(false);

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await api.get(`/activities/audit?${params.toString()}`);
      if (res.data.success) {
        setActivities(res.data.activities);
        setPagination(res.data.pagination);
        setFilterOptions(res.data.filters);
        setSecuritySummary(res.data.securitySummary);
      }
    } catch (error) {
      console.error("Error fetching audit trail:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchAuditTrail();
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) {
      fetchAuditTrail();
    }
  }, [filters.page]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleApplyFilters = () => {
    fetchAuditTrail();
  };

  const handleExport = async () => {
    try {
      const res = await api.post("/activities/export", filters, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit-trail-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting:", error);
      alert("Failed to export audit trail");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "#ef4444";
      case "high":
        return "#f97316";
      case "medium":
        return "#eab308";
      default:
        return "#64748b";
    }
  };

  const getActionTypeColor = (actionType) => {
    switch (actionType) {
      case "create":
        return "#22c55e";
      case "update":
        return "#3b82f6";
      case "delete":
        return "#ef4444";
      case "security":
        return "#8b5cf6";
      case "auth":
        return "#06b6d4";
      default:
        return "#64748b";
    }
  };

  return (
    <DashboardContainer>
      {/* Header */}
      <Header>
        <div className="left">
          <Shield size={24} />
          <div>
            <h1>Audit Trail</h1>
            <p>Comprehensive activity and security monitoring</p>
          </div>
        </div>
        <ExportBtn onClick={handleExport}>
          <Download size={16} />
          Export CSV
        </ExportBtn>
      </Header>

      {/* Security Summary Cards */}
      <SummaryGrid>
        <SummaryCard>
          <div
            className="icon"
            style={{ background: "#fee2e2", color: "#ef4444" }}
          >
            <AlertTriangle size={20} />
          </div>
          <div className="content">
            <div className="value">{securitySummary.eventCount || 0}</div>
            <div className="label">Security Events (7d)</div>
          </div>
        </SummaryCard>

        <SummaryCard>
          <div
            className="icon"
            style={{ background: "#dbeafe", color: "#3b82f6" }}
          >
            <Activity size={20} />
          </div>
          <div className="content">
            <div className="value">{pagination.total || 0}</div>
            <div className="label">Total Activities</div>
          </div>
        </SummaryCard>

        <SummaryCard>
          <div
            className="icon"
            style={{ background: "#fef3c7", color: "#eab308" }}
          >
            <Lock size={20} />
          </div>
          <div className="content">
            <div className="value">
              {securitySummary.criticalEvents?.length || 0}
            </div>
            <div className="label">Critical Events (24h)</div>
          </div>
        </SummaryCard>
      </SummaryGrid>

      {/* Filters */}
      <FilterSection>
        <FilterToggle onClick={() => setShowFilters(!showFilters)}>
          <Filter size={16} />
          Filters
          <ChevronDown
            size={16}
            style={{
              transform: showFilters ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </FilterToggle>

        {showFilters && (
          <FilterGrid>
            <FilterGroup>
              <label>User</label>
              <select
                value={filters.userId}
                onChange={(e) => handleFilterChange("userId", e.target.value)}
              >
                <option value="">All Users</option>
                {filterOptions.users?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </FilterGroup>

            <FilterGroup>
              <label>Action Type</label>
              <select
                value={filters.actionType}
                onChange={(e) =>
                  handleFilterChange("actionType", e.target.value)
                }
              >
                <option value="">All Actions</option>
                {filterOptions.actionTypes?.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </FilterGroup>

            <FilterGroup>
              <label>Entity Type</label>
              <select
                value={filters.entityType}
                onChange={(e) =>
                  handleFilterChange("entityType", e.target.value)
                }
              >
                <option value="">All Entities</option>
                {filterOptions.entityTypes?.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </FilterGroup>

            <FilterGroup>
              <label>Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
              />
            </FilterGroup>

            <FilterGroup>
              <label>End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </FilterGroup>

            <ApplyBtn onClick={handleApplyFilters}>Apply Filters</ApplyBtn>
          </FilterGrid>
        )}
      </FilterSection>

      {/* Activity Table */}
      <TableCard>
        {loading ? (
          <LoadingState>
            <div className="spinner" />
            <p>Loading audit trail...</p>
          </LoadingState>
        ) : activities.length === 0 ? (
          <EmptyState>
            <FileText size={48} />
            <h3>No Activities Found</h3>
            <p>Try adjusting your filters</p>
          </EmptyState>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>IP Address</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity, index) => (
                  <tr
                    key={activity.id || index}
                    onClick={() => onViewDetails && onViewDetails(activity)}
                    style={{ cursor: onViewDetails ? "pointer" : "default" }}
                  >
                    <td>
                      <TimeCell>
                        {new Date(activity.timestamp).toLocaleString()}
                      </TimeCell>
                    </td>
                    <td>
                      <UserCell>
                        <div className="avatar">
                          {activity.user?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="name">
                            {activity.user?.name || "Unknown"}
                          </div>
                          <div className="role">
                            {activity.user?.role || "N/A"}
                          </div>
                        </div>
                      </UserCell>
                    </td>
                    <td>
                      <ActionBadge
                        $color={getActionTypeColor(activity.actionType)}
                      >
                        {activity.action}
                      </ActionBadge>
                    </td>
                    <td>
                      <EntityCell>
                        <span className="type">{activity.entityType}</span>
                        <span className="name">{activity.entityName}</span>
                      </EntityCell>
                    </td>
                    <td>
                      <IPCell>{activity.ipAddress || "N/A"}</IPCell>
                    </td>
                    <td>
                      <SeverityBadge
                        $color={getSeverityColor(activity.severity)}
                      >
                        {activity.isSecurityEvent && (
                          <AlertTriangle size={12} />
                        )}
                        {activity.severity}
                      </SeverityBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Pagination */}
            <Pagination>
              <div className="info">
                Showing {(pagination.page - 1) * pagination.limit + 1} -{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total}
              </div>
              <div className="controls">
                <button
                  disabled={pagination.page === 1}
                  onClick={() =>
                    handleFilterChange("page", pagination.page - 1)
                  }
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  disabled={pagination.page === pagination.pages}
                  onClick={() =>
                    handleFilterChange("page", pagination.page + 1)
                  }
                >
                  Next
                </button>
              </div>
            </Pagination>
          </>
        )}
      </TableCard>
    </DashboardContainer>
  );
};

// Animations
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

// Styled Components
const DashboardContainer = styled.div`
  padding: 40px;
  background: ${(props) => props.theme.bg.primary};
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;

  .left {
    display: flex;
    align-items: center;
    gap: 16px;

    svg {
      color: #f97316;
    }

    h1 {
      margin: 0 0 4px;
      font-size: 2rem;
      font-weight: 800;
      color: ${(props) => props.theme.text.primary};
    }

    p {
      margin: 0;
      color: ${(props) => props.theme.text.secondary};
      font-size: 0.9375rem;
    }
  }
`;

const ExportBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #ea580c;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

const SummaryCard = styled.div`
  background: ${(props) => props.theme.bg.card};
  border-radius: 12px;
  padding: 20px;
  border: 1px solid ${(props) => props.theme.border};
  display: flex;
  align-items: center;
  gap: 16px;
  animation: ${fadeIn} 0.5s ease-out;

  .icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .content {
    .value {
      font-size: 1.875rem;
      font-weight: 700;
      color: ${(props) => props.theme.text.primary};
      line-height: 1;
      margin-bottom: 4px;
    }

    .label {
      font-size: 0.875rem;
      color: ${(props) => props.theme.text.secondary};
    }
  }
`;

const FilterSection = styled.div`
  background: ${(props) => props.theme.bg.card};
  border-radius: 12px;
  border: 1px solid ${(props) => props.theme.border};
  margin-bottom: 24px;
  overflow: hidden;
`;

const FilterToggle = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: ${(props) => props.theme.bg.card};
  border: none;
  font-weight: 600;
  color: ${(props) => props.theme.text.primary};
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: ${(props) => props.theme.bg.hover};
  }
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 20px;
  border-top: 1px solid ${(props) => props.theme.border};
  background: ${(props) => props.theme.bg.tertiary};
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${(props) => props.theme.text.secondary};
  }

  select,
  input {
    padding: 8px 12px;
    border: 1px solid ${(props) => props.theme.border};
    border-radius: 8px;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.2s;
    background: ${(props) => props.theme.bg.card};
    color: ${(props) => props.theme.text.primary};

    &:focus {
      border-color: #f97316;
    }
  }
`;

const ApplyBtn = styled.button`
  grid-column: 1 / -1;
  padding: 10px 20px;
  background: #f97316;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #ea580c;
  }
`;

const TableCard = styled.div`
  background: ${(props) => props.theme.bg.card};
  border-radius: 12px;
  border: 1px solid ${(props) => props.theme.border};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead {
    background: ${(props) => props.theme.bg.tertiary};
    border-bottom: 1px solid ${(props) => props.theme.border};

    th {
      text-align: left;
      padding: 16px 20px;
      font-size: 0.75rem;
      font-weight: 700;
      color: ${(props) => props.theme.text.secondary};
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid ${(props) => props.theme.border};
      transition: background 0.2s;

      &:hover {
        background: ${(props) => props.theme.bg.hover};
      }

      &:last-child {
        border-bottom: none;
      }
    }

    td {
      padding: 16px 20px;
      font-size: 0.875rem;
      color: ${(props) => props.theme.text.primary};
    }
  }
`;

const TimeCell = styled.div`
  color: ${(props) => props.theme.text.secondary};
  font-size: 0.8125rem;
`;

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #3b82f6;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.75rem;
  }

  .name {
    font-weight: 600;
    color: #0f172a;
    font-size: 0.875rem;
  }

  .role {
    font-size: 0.75rem;
    color: #94a3b8;
    text-transform: capitalize;
  }
`;

const ActionBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  background: ${(props) => props.$color}15;
  color: ${(props) => props.$color};
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const EntityCell = styled.div`
  .type {
    display: block;
    font-size: 0.75rem;
    color: #94a3b8;
    margin-bottom: 2px;
  }

  .name {
    display: block;
    font-weight: 500;
    color: #334155;
  }
`;

const IPCell = styled.div`
  font-family: "Courier New", monospace;
  font-size: 0.8125rem;
  color: #64748b;
`;

const SeverityBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: ${(props) => props.$color}15;
  color: ${(props) => props.$color};
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid ${(props) => props.theme.border};

  .info {
    font-size: 0.875rem;
    color: ${(props) => props.theme.text.secondary};
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 12px;

    button {
      padding: 6px 12px;
      background: ${(props) => props.theme.bg.card};
      border: 1px solid ${(props) => props.theme.border};
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      color: ${(props) => props.theme.text.primary};

      &:hover:not(:disabled) {
        background: ${(props) => props.theme.bg.hover};
        border-color: ${(props) => props.theme.text.tertiary};
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    span {
      font-size: 0.875rem;
      color: ${(props) => props.theme.text.secondary};
    }
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: ${(props) => props.theme.text.tertiary};

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid ${(props) => props.theme.bg.tertiary};
    border-top-color: #f97316;
    border-radius: 50%;
    animation: ${spin} 1s linear infinite;
    margin-bottom: 16px;
  }

  p {
    margin: 0;
    font-size: 0.9375rem;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: ${(props) => props.theme.text.tertiary};

  svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  h3 {
    margin: 0 0 8px;
    color: ${(props) => props.theme.text.secondary};
    font-size: 1.125rem;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
  }
`;

export default AuditTrailDashboard;
