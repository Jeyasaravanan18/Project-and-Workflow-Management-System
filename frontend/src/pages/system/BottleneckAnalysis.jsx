import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AlertTriangle, Clock, TrendingUp, RefreshCw, BarChart3, Circle, ArrowRight, Activity, Zap, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import styled, { keyframes, css } from 'styled-components';

const BottleneckAnalysis = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStage, setSelectedStage] = useState('all');

    const fetchBottlenecks = async () => {
        try {
            setRefreshing(true);
            const res = await api.get('/analytics/bottlenecks');
            setData(res.data);
        } catch (error) {
            console.error('Error:', error);
            setData({ stuckTaskCount: 0, stageAnalysis: {}, stuckTasks: [] });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBottlenecks();
    }, []);

    if (loading) {
        return (
            <LoadingState>
                <div className="spinner" />
                <p>Analyzing workflow velocity...</p>
            </LoadingState>
        );
    }

    if (!data) return null;

    // Process Data
    const stageChartData = Object.entries(data.stageAnalysis || {}).map(([name, count]) => ({
        name, count, percentage: data.stuckTaskCount > 0 ? ((count / data.stuckTaskCount) * 100).toFixed(1) : 0
    }));

    const COLORS = ['#0f62fe', '#da1e28', '#198038', '#ff832b', '#8a3ffc', '#00539a'];
    const filteredTasks = selectedStage === 'all' ? data.stuckTasks : data.stuckTasks.filter(t => t.stage === selectedStage);
    const avgDelay = data.stuckTasks.length > 0 ? (data.stuckTasks.reduce((s, t) => s + t.daysStuck, 0) / data.stuckTasks.length).toFixed(1) : '0';

    const getSeverityStyles = (days) => {
        if (days >= 7) return { bg: '#fff1f1', text: '#da1e28', label: 'CRITICAL' };
        if (days >= 5) return { bg: '#fff4e2', text: '#ff8c00', label: 'HIGH' };
        return { bg: '#e0e0e0', text: '#525252', label: 'MEDIUM' };
    };

    return (
        <PageWrapper>
            {/* Cinematic Header */}
            <HeroSection>
                <HeroContent>
                    <div className="top-row">
                        <Badge><Activity size={14} /> Intelligence Hub</Badge>
                        <RefreshButton onClick={fetchBottlenecks} disabled={refreshing}>
                            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
                            {refreshing ? 'Updating...' : 'Scan Workflow'}
                        </RefreshButton>
                    </div>
                    <Title>Bottleneck Detection</Title>
                    <Subtitle>Real-time analysis of workflow constraints and team velocity blockages.</Subtitle>
                </HeroContent>
                <HeroDecorOne />
                <HeroDecorTwo />
            </HeroSection>

            <ContentContainer>
                {/* Bento Grid Stats */}
                <BentoGrid>
                    <BentoCard $delay={0.1} $gradient="linear-gradient(135deg, #FF6B6B 0%, #EE5D5D 100%)" $dark>
                        <CardIcon><AlertTriangle size={24} color="white" /></CardIcon>
                        <CardValue>{data.stuckTaskCount}</CardValue>
                        <CardLabel>Stuck Tasks</CardLabel>
                        <CardMeta>Requiring immediate attention</CardMeta>
                    </BentoCard>

                    <BentoCard $delay={0.15}>
                        <CardIcon $bg="#dbeafe" $color="#3b82f6"><Clock size={24} /></CardIcon>
                        <CardValue>{avgDelay}<span className="unit">days</span></CardValue>
                        <CardLabel>Average Delay</CardLabel>
                        <CardMeta>Time lost per stuck task</CardMeta>
                    </BentoCard>

                    <BentoCard $delay={0.2} $span={2}>
                        <CardHeader>
                            <CardTitle>Impact Analysis</CardTitle>
                            <InfoIcon><Info size={16} /></InfoIcon>
                        </CardHeader>
                        <ImpactGrid>
                            <ImpactItem>
                                <span className="val">{Object.keys(data.stageAnalysis || {}).length}</span>
                                <span className="lbl">Stages Affected</span>
                            </ImpactItem>
                            <ImpactItem>
                                <span className="val">{data.stuckTaskCount > 5 ? 'High' : 'Low'}</span>
                                <span className="lbl">Risk Level</span>
                            </ImpactItem>
                            <ImpactItem>
                                <span className="val">{filteredTasks.length}</span>
                                <span className="lbl">Action Items</span>
                            </ImpactItem>
                        </ImpactGrid>
                    </BentoCard>
                </BentoGrid>

                {/* Charts Area */}
                <GridSplit>
                    <GlassCard $delay={0.3}>
                        <CardHeader>
                            <CardTitle>Stall Distribution by Stage</CardTitle>
                        </CardHeader>
                        <div style={{ height: 320, width: '100%' }}>
                            <ResponsiveContainer>
                                <BarChart data={stageChartData} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <RechartsTooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 8, 8]}>
                                        {stageChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>

                    {data.stuckTaskCount > 0 ? (
                        <RecommendationPanel $delay={0.4}>
                            <div className="rec-header">
                                <Zap size={20} className="icon" />
                                <h3>AI Recommendations</h3>
                                <span className="badge">Powered by AWS Bedrock</span>
                            </div>
                            <RecList>
                                {(data.aiRecommendations || []).length > 0 ? (
                                    data.aiRecommendations.map((rec, idx) => (
                                        <RecCard key={idx}>
                                            <div className="rec-number">{idx + 1}</div>
                                            <div className="rec-content">
                                                <h4>{rec.title}</h4>
                                                <p>{rec.description}</p>
                                            </div>
                                        </RecCard>
                                    ))
                                ) : (
                                    // Fallback to template recommendations if AI fails
                                    stageChartData.slice(0, 3).map((stage, idx) => (
                                        <RecCard key={idx}>
                                            <div className="rec-number">{idx + 1}</div>
                                            <div className="rec-content">
                                                <h4>Optimize "{stage.name}"</h4>
                                                <p>{stage.count} tasks represent {stage.percentage}% of delays. Consider adding resources.</p>
                                            </div>
                                        </RecCard>
                                    ))
                                )}
                            </RecList>
                        </RecommendationPanel>
                    ) : (
                        <GlassCard $delay={0.4} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <EmptyState>
                                <div className="icon-success"><Zap size={32} /></div>
                                <h3>Workflow Optimized</h3>
                                <p>No significant bottlenecks detected.</p>
                            </EmptyState>
                        </GlassCard>
                    )}
                </GridSplit>

                {/* Detailed Table */}
                <GlassCard $delay={0.5} style={{ overflow: 'hidden' }}>
                    <TableHeader>
                        <div className="left">
                            <h3 className="table-title">Stalled Items</h3>
                            <span className="count">{filteredTasks.length} Issues</span>
                        </div>
                        <StyledSelect value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)}>
                            <option value="all">All Stages</option>
                            {Object.keys(data.stageAnalysis || {}).map(s => <option key={s} value={s}>{s}</option>)}
                        </StyledSelect>
                    </TableHeader>

                    {filteredTasks.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Task Details</th>
                                        <th>Current Stage</th>
                                        <th>Assignee</th>
                                        <th>Stall Duration</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTasks.map(task => {
                                        const sev = getSeverityStyles(task.daysStuck);
                                        return (
                                            <tr key={task.id}>
                                                <td>
                                                    <div className="task-name">{task.title}</div>
                                                </td>
                                                <td><StageTag>{task.stage}</StageTag></td>
                                                <td>
                                                    <AssigneePill>
                                                        <div className="avatar">{task.assignedTo?.charAt(0)}</div>
                                                        <span>{task.assignedTo || 'Unassigned'}</span>
                                                    </AssigneePill>
                                                </td>
                                                <td><span className="days">{task.daysStuck} days</span></td>
                                                <td><SeverityTag $bg={sev.bg} $color={sev.text}>{sev.label}</SeverityTag></td>
                                                <td>
                                                    <ViewBtn>View</ViewBtn>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    ) : (
                        <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>No tasks match current filters</div>
                    )}
                </GlassCard>
            </ContentContainer>
        </PageWrapper>
    );
};

// --- Animations ---
const fadeIn = keyframes`from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }`;
const shimmer = keyframes`0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; }`;

// --- Styled Components ---

const PageWrapper = styled.div`
    background: #f4f4f4;
    font-family: 'IBM Plex Sans', 'Inter', sans-serif;
    color: #161616;
    min-height: 100vh;
`;

const LoadingState = styled.div`
    height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: #525252;
    .spinner { width: 40px; height: 40px; border: 3px solid #e0e0e0; border-top-color: #0f62fe; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
`;

const HeroSection = styled.div`
    position: relative;
    padding: 40px 40px 60px;
    background: white;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
`;

const HeroDecorOne = styled.div``;
const HeroDecorTwo = styled.div``;

const HeroContent = styled.div`
    max-width: 1400px; width: 100%; margin: 0 auto; position: relative; z-index: 10;
    
    .top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
`;

const Badge = styled.div`
    display: flex; align-items: center; gap: 6px;
    padding: 4px 10px; background: #e0e0e0; color: #525252;
    border-radius: 0; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
`;

const RefreshButton = styled.button`
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px; background: white; border: 1px solid #e0e0e0;
    border-radius: 0; font-weight: 600; font-size: 0.875rem; color: #161616;
    cursor: pointer; transition: all 0.2s;
    &:hover { background: #f4f4f4; border-color: #0f62fe; color: #0f62fe; }
    .spin { animation: spin 1s linear infinite; }
`;

const Title = styled.h1`
    font-size: 2rem; font-weight: 600; color: #161616; margin: 0 0 8px;
    letter-spacing: 0;
`;

const Subtitle = styled.p`
    font-size: 0.975rem; color: #525252; max-width: 600px; margin: 0;
`;

const ContentContainer = styled.div`
    max-width: 1400px; margin: 0 auto; padding: 32px 40px;
    position: relative;
`;

const BentoGrid = styled.div`
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; margin-bottom: 24px;
    border: 1px solid #e0e0e0; background: #e0e0e0;
`;

const BentoCard = styled.div`
    background: ${props => props.$dark ? '#161616' : 'white'};
    grid-column: span ${props => props.$span || 1};
    border-radius: 0; padding: 24px;
    border: none;
    position: relative; overflow: hidden;
    animation: ${fadeIn} 0.5s ease-out backwards;
    animation-delay: ${props => props.$delay}s;

    ${props => props.$gradient && css`
        background: #da1e28;
        border: none;
    `}
`;

const CardIcon = styled.div`
    width: 40px; height: 40px; border-radius: 0;
    background: ${props => props.$bg || 'rgba(255,255,255,0.15)'};
    color: ${props => props.$color || 'white'};
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px;
`;

const CardValue = styled.div`
    font-size: 2.5rem; font-weight: 700; color: ${props => props.$dark ? 'white' : '#0f172a'};
    line-height: 1; margin-bottom: 8px;
    ${props => props.children > 50 && css`color: #ef4444;`} // Example conditional styling

    .unit { font-size: 1rem; color: #94a3b8; font-weight: 500; margin-left: 6px; }
`;

const CardLabel = styled.div`
    font-size: 1rem; font-weight: 600; color: ${props => props.$dark ? 'rgba(255,255,255,0.9)' : '#334155'};
`;

const CardMeta = styled.div`
    font-size: 0.8125rem; color: ${props => props.$dark ? 'rgba(255,255,255,0.6)' : '#94a3b8'}; margin-top: 4px;
`;

const CardHeader = styled.div`
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
`;

const CardTitle = styled.h3`
    font-size: 1.125rem; font-weight: 700; color: #0f172a; margin: 0;
`;

const InfoIcon = styled.div`color: #94a3b8; cursor: pointer; &:hover { color: #64748b; }`;

const ImpactGrid = styled.div`
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
`;

const ImpactItem = styled.div`
    background: #f4f4f4; border-radius: 0; padding: 16px; display: flex; flex-direction: column; align-items: center; text-align: center;
    .val { font-size: 1.25rem; font-weight: 600; color: #161616; margin-bottom: 4px; }
    .lbl { font-size: 0.75rem; color: #525252; font-weight: 600; text-transform: uppercase; }
`;

const GridSplit = styled.div`
    display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 24px;
`;

const GlassCard = styled.div`
    background: white; border-radius: 0; padding: 24px; border: 1px solid #e0e0e0;
    animation: ${fadeIn} 0.5s ease-out backwards;
    animation-delay: ${props => props.$delay}s;
`;

const RecommendationPanel = styled(GlassCard)`
    background: #edf5ff; border-left: 4px solid #0f62fe; border-top: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;
    .rec-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; color: #0043ce; 
        h3 { font-size: 1rem; font-weight: 600; margin: 0; }
        .icon { }
        .badge { 
            margin-left: auto; 
            font-size: 0.6875rem; 
            font-weight: 600; 
            padding: 4px 10px; 
            background: #0f62fe;
            color: white; 
            border-radius: 0; 
            text-transform: uppercase; 
            letter-spacing: 0.5px;
        }
    }
`;

const RecList = styled.div`display: flex; flex-direction: column; gap: 16px;`;

const RecCard = styled.div`
    display: flex; gap: 16px; align-items: flex-start;
    .rec-number { width: 20px; height: 20px; border-radius: 0; background: #0f62fe; color: white; font-weight: 600; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
    h4 { margin: 0 0 4px; font-size: 0.9375rem; color: #161616; }
    p { margin: 0; font-size: 0.8125rem; color: #525252; line-height: 1.4; }
`;

const EmptyState = styled.div`
    text-align: center; color: #94a3b8;
    .icon-success { width: 64px; height: 64px; background: #f0fdf4; color: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    h3 { color: #0f172a; margin-bottom: 4px; }
`;

const TableHeader = styled.div`
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
    .left {
         display: flex; align-items: baseline; gap: 12px;
         h3 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #0f172a; }
         .count { font-size: 0.875rem; color: #64748b; font-weight: 500; }
    }
`;

const StyledSelect = styled.select`
    padding: 8px 16px; border-radius: 0; border: 1px solid #e0e0e0; font-size: 0.875rem; outline: none; background: white; cursor: pointer;
    &:focus { border-color: #0f62fe; box-shadow: inset 0 -2px #0f62fe; }
`;

const Table = styled.table`
    width: 100%; border-collapse: collapse;
    th { text-align: left; padding: 0 16px 12px; color: #525252; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e0e0e0; }
    td { padding: 16px; border-bottom: 1px solid #e0e0e0; background: white;
        .task-name { font-size: 0.9375rem; font-weight: 500; color: #161616; }
        .days { font-weight: 600; color: #161616; }
    }
    tr:hover td { background: #f4f4f4; }
`;

const StageTag = styled.span`
    padding: 4px 8px; background: #e0e0e0; border: none; border-radius: 0; font-size: 0.8125rem; font-weight: 600; color: #161616;
`;

const AssigneePill = styled.div`
    display: flex; align-items: center; gap: 8px;
    .avatar { width: 24px; height: 24px; background: #0f62fe; color: white; border-radius: 0; font-size: 0.625rem; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    span { font-size: 0.875rem; color: #161616; font-weight: 500; }
`;

const SeverityTag = styled.span`
    padding: 4px 10px; background: ${props => props.$bg}; color: ${props => props.$color}; font-size: 0.75rem; font-weight: 700; border-radius: 0;
`;

const ViewBtn = styled.button`
    padding: 6px 16px; background: white; border: 1px solid #e0e0e0; border-radius: 0; font-weight: 600; font-size: 0.8125rem; cursor: pointer; color: #161616;
    &:hover { background: #0f62fe; color: white; border-color: #0f62fe; }
`;

export default BottleneckAnalysis;
