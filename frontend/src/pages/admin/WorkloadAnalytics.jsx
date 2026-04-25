import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import * as XLSX from 'xlsx';
import {
    BarChart3,
    Users,
    Zap,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Search,
    Filter,
    Download,
    RefreshCw,
    TrendingUp,
    ChevronDown,
    FileText,
    Table2,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import styled, { keyframes, css } from 'styled-components';

const WorkloadAnalytics = () => {
    const socket = useSocket();
    const [apiData, setApiData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [exportLoading, setExportLoading] = useState(false);
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef(null);

    const fetchData = async () => {
        try {
            setRefreshing(true);
            const res = await api.get('/analytics/workload');
            console.log('Workload API Response:', res.data);
            // Backend returns {success: true, data: {...}}, so extract the data property
            setApiData(res.data.data || res.data);
        } catch (error) {
            console.error('Error fetching workload:', error);
            setApiData(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
                setExportDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Real-time updates via Socket.IO
    useEffect(() => {
        if (!socket) return;

        const handleUpdate = () => {
            console.log('🔄 Workload analytics update received via socket');
            fetchData();
        };

        socket.on('task:created', handleUpdate);
        socket.on('task:updated', handleUpdate);
        socket.on('task:deleted', handleUpdate);
        socket.on('task:assigned', handleUpdate);

        return () => {
            socket.off('task:created', handleUpdate);
            socket.off('task:updated', handleUpdate);
            socket.off('task:deleted', handleUpdate);
            socket.off('task:assigned', handleUpdate);
        };
    }, [socket]);

    // ── Export Helpers ──────────────────────────────────────────────────────────
    const triggerDownload = (data, filename, mimeType) => {
        const blob = new Blob([data], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    };

    const autoWidth = (ws, data) => {
        if (!data || !data.length) return;
        const colWidths = Object.keys(data[0]).map((key) => ({
            wch: Math.max(key.length, ...data.map((row) => String(row[key] ?? '').length)) + 4,
        }));
        ws['!cols'] = colWidths;
    };

    const applyHeaderStyle = (ws, numCols) => {
        const headerStyle = {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
            fill: { fgColor: { rgb: '0F172A' } },
            alignment: { horizontal: 'center', vertical: 'center' },
        };
        for (let c = 0; c < numCols; c++) {
            const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
            if (ws[cellAddr]) ws[cellAddr].s = headerStyle;
        }
    };

    const handleExportWorkload = async (format) => {
        if (!apiData) return;
        try {
            setExportLoading(true);
            setExportDropdownOpen(false);

            const members = apiData?.members || [];
            const summary = apiData?.summary || {};
            const exportDate = new Date().toISOString().split('T')[0];

            // ── Member rows ──
            const memberRows = members.map((u, i) => ({
                '#': i + 1,
                Name: u.name || 'Unknown',
                Email: u.email || '',
                Role: u.role || '',
                'Active Tasks': u.activeTasks || 0,
                'Est. Hours': u.estimatedHours || 0,
                'Completed Tasks': u.completedTasks || 0,
                Status: u.status || 'Unknown',
            }));

            // ── Summary rows ──
            const summaryRows = [
                { Metric: 'Total Active Tasks', Value: summary.totalActiveTasks || 0 },
                { Metric: 'Overloaded Members', Value: summary.overloaded || 0 },
                { Metric: 'Idle Members', Value: summary.idle || 0 },
                { Metric: 'Total Estimated Hours', Value: summary.totalEstimatedHours || 0 },
                { Metric: 'Report Generated', Value: new Date().toLocaleString() },
                { Metric: 'Platform', Value: 'Harmonic Halo Enterprise' },
            ];

            // ── Overloaded members ──
            const overloadedRows = members
                .filter((u) => u.status === 'Overloaded')
                .map((u) => ({
                    Name: u.name,
                    'Active Tasks': u.activeTasks,
                    'Est. Hours': u.estimatedHours,
                    'Recommended Action': 'Reassign tasks or reduce workload',
                }));

            if (format === 'csv') {
                const headers = Object.keys(memberRows[0] || { '#': '' });
                let csv = `TEAM WORKLOAD REPORT - ${exportDate}\n\n`;
                csv += `TEAM MEMBERS\n`;
                csv += headers.join(',') + '\n';
                memberRows.forEach((row) => {
                    csv += headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
                });
                csv += '\n\nSUMMARY\n';
                csv += 'Metric,Value\n';
                summaryRows.forEach((r) => {
                    csv += `"${r.Metric}","${r.Value}"\n`;
                });
                triggerDownload(
                    '\uFEFF' + csv,
                    `workload-report-${exportDate}.csv`,
                    'text/csv; charset=utf-8'
                );
            } else {
                // Excel: multiple sheets
                const wb = XLSX.utils.book_new();

                // Sheet 1: Team Members
                const sheetData = memberRows.length > 0 ? memberRows
                    : [{ '#': '', Name: 'No members found', Email: '', Role: '', 'Active Tasks': 0, 'Est. Hours': 0, 'Completed Tasks': 0, Status: '' }];
                const ws1 = XLSX.utils.json_to_sheet(sheetData);
                autoWidth(ws1, sheetData);
                applyHeaderStyle(ws1, Object.keys(sheetData[0]).length);
                ws1['!freeze'] = { xSplit: 0, ySplit: 1 };
                XLSX.utils.book_append_sheet(wb, ws1, 'Team Workload');

                // Sheet 2: Overloaded Members Alert
                const overData = overloadedRows.length > 0 ? overloadedRows
                    : [{ Name: 'No overloaded members', 'Active Tasks': 0, 'Est. Hours': 0, 'Recommended Action': '' }];
                const ws2 = XLSX.utils.json_to_sheet(overData);
                autoWidth(ws2, overData);
                applyHeaderStyle(ws2, Object.keys(overData[0]).length);
                XLSX.utils.book_append_sheet(wb, ws2, 'Overloaded Alert');

                // Sheet 3: Summary
                const ws3 = XLSX.utils.json_to_sheet(summaryRows);
                autoWidth(ws3, summaryRows);
                applyHeaderStyle(ws3, 2);
                XLSX.utils.book_append_sheet(wb, ws3, 'Summary');

                const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx', cellStyles: true });
                triggerDownload(
                    buf,
                    `workload-report-${exportDate}.xlsx`,
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                );
            }
        } catch (err) {
            console.error('[WorkloadExport] Failed:', err);
            alert('Export failed. Please try again.');
        } finally {
            setExportLoading(false);
        }
    };

    if (loading) {
        return (
            <LoadingPage>
                <Spinner />
                <p>Analyzing team capacity...</p>
            </LoadingPage>
        );
    }

    // Handle role-based data structure
    const viewType = apiData?.viewType || 'team';
    const userRole = apiData?.userRole || 'member';

    // For members: show individual workload
    if (viewType === 'individual') {
        const myWorkload = apiData?.myWorkload || {};
        const summary = apiData?.summary || {};

        return (
            <PageContainer>
                <Header>
                    <HeaderContent>
                        <TitleSection>
                            <Badge><BarChart3 size={14} /> My Workload</Badge>
                            <Title>Personal Capacity</Title>
                            <Subtitle>Track your current task load and capacity.</Subtitle>
                        </TitleSection>
                        <Actions>
                            <ActionButton onClick={fetchData} disabled={refreshing}>
                                <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
                                Refresh
                            </ActionButton>
                        </Actions>
                    </HeaderContent>
                </Header>

                <MetricsGrid>
                    <MetricCard $delay={0.1}>
                        <IconWrapper $color="#f97316">
                            <Zap size={24} />
                        </IconWrapper>
                        <MetricInfo>
                            <Value>{summary.totalActiveTasks || 0}</Value>
                            <Label>Active Tasks</Label>
                        </MetricInfo>
                    </MetricCard>

                    <MetricCard $delay={0.2}>
                        <IconWrapper $color="#334155">
                            <Clock size={24} />
                        </IconWrapper>
                        <MetricInfo>
                            <Value>{summary.totalEstimatedHours || 0}h</Value>
                            <Label>Estimated Effort</Label>
                        </MetricInfo>
                    </MetricCard>

                    <MetricCard $delay={0.3} $highlight={summary.status === 'Overloaded'}>
                        <IconWrapper $color={summary.status === 'Overloaded' ? '#ef4444' : '#22c55e'}>
                            <CheckCircle2 size={24} />
                        </IconWrapper>
                        <MetricInfo>
                            <Value>{summary.status || 'Optimal'}</Value>
                            <Label>Current Status</Label>
                        </MetricInfo>
                    </MetricCard>
                </MetricsGrid>

                <ContentSplit>
                    <ChartSection $delay={0.4}>
                        <CardHeader>
                            <h3>Task Distribution by Stage</h3>
                        </CardHeader>
                        <ChartWrapper>
                            {myWorkload.taskDistribution && myWorkload.taskDistribution.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={myWorkload.taskDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="status"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                        />
                                        <RechartsTooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                border: 'none',
                                                borderRadius: '12px',
                                                color: '#f8fafc',
                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                    <Users size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                    <h4>No tasks found to analyze</h4>
                                </div>
                            )}
                        </ChartWrapper>
                    </ChartSection>

                    <ListSection $delay={0.5}>
                        <CardHeader>
                            <h3>Focus Recommendation</h3>
                        </CardHeader>
                        <div style={{ padding: '20px' }}>
                            <p style={{ marginBottom: '16px', fontSize: '1rem', color: '#334155' }}>
                                <strong>Status:</strong> <span style={{ color: getStatusColor(summary.status) }}>{summary.status}</span>
                            </p>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #6366f1' }}>
                                {summary.status === 'Overloaded' && (
                                    <>
                                        <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>⚠️ Capacity Alert</p>
                                        <p style={{ fontSize: '0.875rem' }}>You have {myWorkload.activeTasks} active tasks. Consider prioritizing or delegating to maintain quality.</p>
                                    </>
                                )}
                                {summary.status === 'Optimal' && (
                                    <>
                                        <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>✅ Peak Performance</p>
                                        <p style={{ fontSize: '0.875rem' }}>Your current workload is perfectly balanced. You're in a great position to maintain steady progress.</p>
                                    </>
                                )}
                                {summary.status === 'Idle' && (
                                    <>
                                        <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>💡 Growth Opportunity</p>
                                        <p style={{ fontSize: '0.875rem' }}>You have current capacity. This is an excellent time to pick up backlogged items or support team members.</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </ListSection>
                </ContentSplit>
            </PageContainer>
        );
    }

    // For managers/admins: show team-wide workload
    const data = apiData?.members || [];
    const summary = apiData?.summary || {};

    // Derived Metrics from API summary or calculate from data
    const totalActiveTasks = summary.totalActiveTasks || data.reduce((acc, curr) => acc + curr.activeTasks, 0);
    const overloadedMembers = summary.overloaded || data.filter(u => u.status === 'Overloaded').length;
    const idleMembers = summary.idle || data.filter(u => u.status === 'Idle').length;
    const totalHours = summary.totalEstimatedHours || data.reduce((acc, curr) => acc + (curr.estimatedHours || 0), 0);

    // Filtered Data
    const filteredData = data.filter(u => {
        const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || u.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const chartData = data.map(u => ({
        name: (u.name || 'Unknown').split(' ')[0], // First name for chart
        tasks: u.activeTasks,
        fullUser: u
    })).sort((a, b) => b.tasks - a.tasks).slice(0, 10); // Top 10 by load

    const getStatusColor = (status) => {
        switch (status) {
            case 'Overloaded': return '#f97316'; // Orange-500
            case 'Optimal': return '#22c55e'; // Green-500
            case 'Idle': return '#94a3b8'; // Slate-400
            default: return '#64748b';
        }
    };

    return (
        <PageContainer>
            {/* Header Section */}
            <Header>
                <HeaderContent>
                    <TitleSection>
                        <Badge><BarChart3 size={14} /> Capacity Planning</Badge>
                        <Title>Team Workload Analytics</Title>
                        <Subtitle>Monitor team distribution and balance resource allocation.</Subtitle>
                    </TitleSection>
                    <Actions>
                        <ActionButton onClick={fetchData} disabled={refreshing}>
                            <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
                            Refresh
                        </ActionButton>
                        <ExportDropdownWrapper ref={exportDropdownRef}>
                            <ActionButton
                                className="primary"
                                onClick={() => setExportDropdownOpen((o) => !o)}
                                disabled={exportLoading || !apiData}
                            >
                                {exportLoading ? <ExportSpinner /> : <Download size={18} />}
                                Export Report
                                <ChevronDown size={13} style={{ marginLeft: 2, opacity: 0.7 }} />
                            </ActionButton>
                            {exportDropdownOpen && (
                                <ExportDropdownMenu>
                                    <ExportDropdownItem onClick={() => handleExportWorkload('xlsx')}>
                                        <Table2 size={15} />
                                        Export as Excel
                                        <ExportBadge $color="#22c55e">XLSX</ExportBadge>
                                    </ExportDropdownItem>
                                    <ExportDropdownItem onClick={() => handleExportWorkload('csv')}>
                                        <FileText size={15} />
                                        Export as CSV
                                        <ExportBadge $color="#64748b">CSV</ExportBadge>
                                    </ExportDropdownItem>
                                </ExportDropdownMenu>
                            )}
                        </ExportDropdownWrapper>
                    </Actions>
                </HeaderContent>
            </Header>

            {/* Metrics Grid */}
            <MetricsGrid>
                <MetricCard $delay={0.1}>
                    <IconWrapper $color="#f97316">
                        <Zap size={24} />
                    </IconWrapper>
                    <MetricInfo>
                        <Value>{totalActiveTasks}</Value>
                        <Label>Active Assignments</Label>
                    </MetricInfo>
                </MetricCard>

                <MetricCard $delay={0.2} $highlight={overloadedMembers > 0}>
                    <IconWrapper $color={overloadedMembers > 0 ? '#ef4444' : '#22c55e'}>
                        <AlertTriangle size={24} />
                    </IconWrapper>
                    <MetricInfo>
                        <Value>{overloadedMembers}</Value>
                        <Label>Overloaded Members</Label>
                    </MetricInfo>
                </MetricCard>

                <MetricCard $delay={0.3}>
                    <IconWrapper $color="#64748b">
                        <Users size={24} />
                    </IconWrapper>
                    <MetricInfo>
                        <Value>{idleMembers}</Value>
                        <Label>Available Resources</Label>
                    </MetricInfo>
                </MetricCard>

                <MetricCard $delay={0.4}>
                    <IconWrapper $color="#334155">
                        <Clock size={24} />
                    </IconWrapper>
                    <MetricInfo>
                        <Value>{totalHours}h</Value>
                        <Label>Estimated Effort</Label>
                    </MetricInfo>
                </MetricCard>
            </MetricsGrid>

            {/* Content Area */}
            <ContentSplit>
                {/* Main Chart */}
                <ChartSection $delay={0.5}>
                    <CardHeader>
                        <h3>Capacity Distribution</h3>
                        <div className="meta">Top 10 Members by Task Count</div>
                    </CardHeader>
                    <ChartWrapper>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: '#f8fafc',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                                    }}
                                />
                                <Bar dataKey="tasks" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={getStatusColor(entry.fullUser.status)}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartWrapper>
                </ChartSection>

                {/* Team List */}
                <ListSection $delay={0.6}>
                    <CardHeader>
                        <h3>Team Members</h3>
                        <div className="actions">
                            <SearchInput>
                                <Search size={14} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </SearchInput>
                        </div>
                    </CardHeader>

                    <FilterTabs>
                        {['All', 'Optimal', 'Overloaded', 'Idle'].map(status => (
                            <Tab
                                key={status}
                                $active={filterStatus === status}
                                onClick={() => setFilterStatus(status)}
                            >
                                {status}
                            </Tab>
                        ))}
                    </FilterTabs>

                    <MembersList>
                        {filteredData.length > 0 ? (
                            filteredData.map(user => (
                                <MemberRow key={user.userId}>
                                    <MemberInfo>
                                        <Avatar>{user.name.charAt(0)}</Avatar>
                                        <div>
                                            <div className="name">{user.name}</div>
                                            <div className="role">{user.activeTasks} active tasks</div>
                                        </div>
                                    </MemberInfo>
                                    <StatusPill $status={user.status}>
                                        {user.status === 'Overloaded' && <TrendingUp size={12} />}
                                        {user.status}
                                    </StatusPill>
                                </MemberRow>
                            ))
                        ) : (
                            <EmptyState>
                                <Users size={32} />
                                <p>No members found matching filters</p>
                            </EmptyState>
                        )}
                    </MembersList>
                </ListSection>
            </ContentSplit>
        </PageContainer>
    );
};

// Animations
const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

// Styled Components
const PageContainer = styled.div`
    min-height: 100vh;
    padding: 32px;
    background: #f8fafc;
    color: #0f172a;
    font-family: 'Inter', 'Outfit', sans-serif;
`;

const LoadingPage = styled.div`
    height: 80vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #64748b;
    gap: 16px;
`;

const Spinner = styled.div`
    width: 40px;
    height: 40px;
    border: 3px solid #e2e8f0;
    border-top-color: #f97316;
    border-radius: 50%;
    animation: ${spin} 1s linear infinite;
`;

const Header = styled.div`
    margin-bottom: 32px;
`;

const HeaderContent = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
`;

const TitleSection = styled.div``;

const Badge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const Title = styled.h1`
    font-size: 2.5rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 8px;
    letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
    font-size: 1.125rem;
    color: #64748b;
`;

const Actions = styled.div`
    display: flex;
    gap: 12px;
`;

const ActionButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    color: #475569;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
        transform: translateY(-1px);
        background: #f8fafc;
        border-color: #cbd5e1;
        color: #1e293b;
    }

    &.primary {
        background: #0f172a;
        color: white;
        border: none;
        &:hover {
            background: #1e293b;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
        }
    }

    &:disabled {
        opacity: 0.6;
        cursor: wait;
    }

    .spin {
        animation: ${spin} 1s linear infinite;
    }
`;

const MetricsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    margin-bottom: 32px;

    @media (max-width: 1200px) {
        grid-template-columns: repeat(2, 1fr);
    }
`;

const MetricCard = styled.div`
    background: white;
    padding: 24px;
    border-radius: 16px;
    border: 1px solid ${props => props.$highlight ? '#fbd38d' : '#e2e8f0'};
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
    display: flex;
    align-items: center;
    gap: 16px;
    animation: ${fadeIn} 0.5s ease-out backwards;
    animation-delay: ${props => props.$delay}s;
    transition: transform 0.2s;

    &:hover {
        transform: translateY(-2px);
    }
`;

const IconWrapper = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: ${props => `${props.$color}15`};
    color: ${props => props.$color};
    display: flex;
    align-items: center;
    justify-content: center;
`;

const MetricInfo = styled.div`
    display: flex;
    flex-direction: column;
`;

const Value = styled.span`
    font-size: 1.75rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
`;

const Label = styled.span`
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
`;

const ContentSplit = styled.div`
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
    align-items: start;

    @media (max-width: 1024px) {
        grid-template-columns: 1fr;
    }
`;

const ChartSection = styled.div`
    background: white;
    padding: 24px;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    min-height: 400px;
    animation: ${fadeIn} 0.5s ease-out backwards;
    animation-delay: ${props => props.$delay}s;
`;

const ListSection = styled.div`
    background: white;
    padding: 24px;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    animation: ${fadeIn} 0.5s ease-out backwards;
    animation-delay: ${props => props.$delay}s;
    display: flex;
    flex-direction: column;
`;

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h3 {
        font-size: 1.1rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
    }

    .meta {
        font-size: 0.875rem;
        color: #64748b;
    }

    .actions {
        display: flex;
        gap: 8px;
    }
`;

const ChartWrapper = styled.div`
    height: 350px;
    width: 100%;
`;

const SearchInput = styled.div`
    position: relative;
    
    svg {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
    }

    input {
        padding: 8px 12px 8px 32px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;
        color: #0f172a;
        width: 150px;
        transition: all 0.2s;

        &:focus {
            outline: none;
            border-color: #cbd5e1;
            width: 200px;
        }

        &::placeholder {
            color: #cbd5e1;
        }
    }
`;

const FilterTabs = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f1f5f9;
    overflow-x: auto;
`;

const Tab = styled.button`
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: ${props => props.$active ? '#0f172a' : 'transparent'};
    color: ${props => props.$active ? 'white' : '#64748b'};
    transition: all 0.2s;

    &:hover {
        background: ${props => props.$active ? '#0f172a' : '#f1f5f9'};
    }
`;

const MembersList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 500px;
    overflow-y: auto;
    padding-right: 4px;

    &::-webkit-scrollbar {
        width: 4px;
    }
    &::-webkit-scrollbar-track {
        background: transparent;
    }
    &::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 4px;
    }
`;

const MemberRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border-radius: 12px;
    background: #f8fafc;
    transition: background 0.2s;

    &:hover {
        background: #f1f5f9;
        cursor: default;
    }
`;

const MemberInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;

    .name {
        font-size: 0.9rem;
        font-weight: 600;
        color: #0f172a;
    }

    .role {
        font-size: 0.75rem;
        color: #64748b;
    }
`;

const Avatar = styled.div`
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e2e8f0;
    color: #475569;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.8rem;
`;

const StatusPill = styled.div`
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 4px;
    
    ${props => {
        switch (props.$status) {
            case 'Overloaded':
                return `
                    background: #fff7ed;
                    color: #c2410c;
                    border: 1px solid #ffedd5;
                `;
            case 'Optimal':
                return `
                    background: #f0fdf4;
                    color: #15803d;
                    border: 1px solid #dcfce7;
                `;
            default:
                return `
                    background: #f1f5f9;
                    color: #475569;
                `;
        }
    }}
`;

const EmptyState = styled.div`
    padding: 40px;
    text-align: center;
    color: #94a3b8;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    
    p {
        font-size: 0.875rem;
    }
`;

const spin2 = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

const ExportSpinner = styled.div`
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: ${spin2} 0.7s linear infinite;
    flex-shrink: 0;
`;

const dropdownFadeIn = keyframes`
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
`;

const ExportDropdownWrapper = styled.div`
    position: relative;
`;

const ExportDropdownMenu = styled.div`
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06);
    min-width: 220px;
    z-index: 1000;
    overflow: hidden;
    animation: ${dropdownFadeIn} 0.18s ease-out;
    padding: 8px;
`;

const ExportDropdownItem = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #0f172a;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease;

    &:hover {
        background: #f8fafc;
    }

    svg {
        color: #64748b;
        flex-shrink: 0;
    }
`;

const ExportBadge = styled.span`
    margin-left: auto;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    background: ${(props) => props.$color}18;
    color: ${(props) => props.$color};
    border: 1px solid ${(props) => props.$color}30;
`;

export default WorkloadAnalytics;

