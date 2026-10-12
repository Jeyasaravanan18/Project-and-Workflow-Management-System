import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
    Zap,
    Target,
    TrendingUp,
    Shield,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Star,
    Award,
    LayoutDashboard
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import styled, { keyframes } from 'styled-components';

const PersonalPerformance = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPerformance = async () => {
            try {
                const res = await api.get('/analytics/personal-performance');
                setData(res.data.data);
            } catch (error) {
                console.error('Error fetching performance:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPerformance();
    }, []);

    if (loading) {
        return (
            <LoadingContainer>
                <Spinner />
                <p>Generating your performance profile...</p>
            </LoadingContainer>
        );
    }

    if (!data) return <p style={{ padding: 32 }}>Failed to load performance data.</p>;

    const { metrics, aiInsights, velocityTrend, topPriorities } = data;

    return (
        <PageContainer>
            <Header>
                <HeaderLeft>
                    <Badge><Star size={12} /> Performance Insights</Badge>
                    <Title>Workspace Performance</Title>
                    <Subtitle>Personal productivity metrics and AI-guided recommendations.</Subtitle>
                </HeaderLeft>
                <HeaderRight>
                    <EfficiencyScore>
                        <ScoreValue>{aiInsights.efficiencyScore}%</ScoreValue>
                        <ScoreLabel>Efficiency Score</ScoreLabel>
                    </EfficiencyScore>
                </HeaderRight>
            </Header>

            <TopGrid>
                <MetricCard $delay={0.1}>
                    <IconBox $color="#008060" $bg="#ecfdf5">
                        <CheckCircle2 size={22} />
                    </IconBox>
                    <MetricContent>
                        <MetricValue>{metrics.completedLastMonth}</MetricValue>
                        <MetricLabel>Completed (30d)</MetricLabel>
                    </MetricContent>
                </MetricCard>

                <MetricCard $delay={0.2}>
                    <IconBox $color="#d97706" $bg="#fffbeb">
                        <Clock size={22} />
                    </IconBox>
                    <MetricContent>
                        <MetricValue>{metrics.activeTasks}</MetricValue>
                        <MetricLabel>Active Tasks</MetricLabel>
                    </MetricContent>
                </MetricCard>

                <MetricCard $delay={0.3}>
                    <IconBox $color="#2563eb" $bg="#eff6ff">
                        <Target size={22} />
                    </IconBox>
                    <MetricContent>
                        <MetricValue>{metrics.completionRate}%</MetricValue>
                        <MetricLabel>Completion Rate</MetricLabel>
                    </MetricContent>
                </MetricCard>

                <MetricCard $delay={0.4}>
                    <IconBox $color="#7c3aed" $bg="#f5f3ff">
                        <Award size={22} />
                    </IconBox>
                    <MetricContent>
                        <MetricValue>Lv. 4</MetricValue>
                        <MetricLabel>Current Rank</MetricLabel>
                    </MetricContent>
                </MetricCard>
            </TopGrid>

            <MainSection>
                <LeftCol>
                    <Card $delay={0.5}>
                        <CardHeader>
                            <CardTitle><TrendingUp size={18} color="#008060" /> Productivity Velocity</CardTitle>
                            <CardSub>Tasks completed per week</CardSub>
                        </CardHeader>
                        <ChartBox>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={velocityTrend}>
                                    <defs>
                                        <linearGradient id="colorCompEmerald" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#008060" stopOpacity={0.25}/>
                                            <stop offset="95%" stopColor="#008060" stopOpacity={0.0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                                    />
                                    <Area type="monotone" dataKey="completed" stroke="#008060" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompEmerald)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartBox>
                    </Card>

                    <Card $delay={0.6}>
                        <CardHeader>
                            <CardTitle><LayoutDashboard size={18} color="#008060" /> Top Priorities</CardTitle>
                            <CardSub>Curated based on deadlines and task impact</CardSub>
                        </CardHeader>
                        <List>
                            {topPriorities.map((task, i) => (
                                <ListItem key={task._id} $delay={0.1 * i}>
                                    <TaskInfo>
                                        <TaskTitle>{task.title}</TaskTitle>
                                        <TaskMeta>
                                            <Shield size={12} /> {task.currentStage?.name || 'Backlog'} • 
                                            <Clock size={12} style={{ marginLeft: 8 }} /> {new Date(task.dueDate).toLocaleDateString()}
                                        </TaskMeta>
                                    </TaskInfo>
                                    <ArrowRight size={16} color="#94a3b8" />
                                </ListItem>
                            ))}
                        </List>
                    </Card>
                </LeftCol>

                <RightCol>
                    <AICard $delay={0.7}>
                        <AIHeader>
                            <SparkleIcon><Zap size={18} /></SparkleIcon>
                            <h3>AI Productivity Guard</h3>
                        </AIHeader>
                        <AIDescription>
                            {aiInsights.recommendedFocus}
                        </AIDescription>
                        {aiInsights.nextBestTask && (
                            <NextTaskBox>
                                <NextLabel>Next Best Action</NextLabel>
                                <NextTitle>{aiInsights.nextBestTask.title}</NextTitle>
                                <NextActionBtn>Start Task <ArrowRight size={14} /></NextActionBtn>
                            </NextTaskBox>
                        )}
                        <AIFooter>
                            <AlertCircle size={14} /> Insights updated based on recent activity
                        </AIFooter>
                    </AICard>

                    <MilestoneCard $delay={0.8}>
                        <CardHeader>
                            <CardTitle>Milestones</CardTitle>
                        </CardHeader>
                        <MilestoneList>
                            <MilestoneItem $completed>
                                <MilestoneDot $completed />
                                <MilestoneText>Complete 5 tasks this week</MilestoneText>
                            </MilestoneItem>
                            <MilestoneItem $completed>
                                <MilestoneDot $completed />
                                <MilestoneText>Reduce average lead time by 10%</MilestoneText>
                            </MilestoneItem>
                            <MilestoneItem>
                                <MilestoneDot />
                                <MilestoneText>Collaborate on 3 projects</MilestoneText>
                            </MilestoneItem>
                        </MilestoneList>
                    </MilestoneCard>
                </RightCol>
            </MainSection>
        </PageContainer>
    );
};

// --- Animations ---
const fadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

// --- Styled Components ---
const PageContainer = styled.div`
    padding: 32px;
    background: #f8fafc;
    min-height: 100vh;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const LoadingContainer = styled.div`
    height: 80vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: #64748b;
    font-size: 14px;
`;

const Spinner = styled.div`
    width: 36px;
    height: 36px;
    border: 3px solid #e2e8f0;
    border-top-color: #008060;
    border-radius: 50%;
    animation: ${spin} 0.8s linear infinite;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
`;

const HeaderLeft = styled.div``;
const HeaderRight = styled.div``;

const Badge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #ecfdf5;
    color: #008060;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    border: 1px solid #a7f3d0;
    margin-bottom: 8px;
`;

const Title = styled.h1`
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #111827;
    margin: 0;
`;

const Subtitle = styled.p`
    color: #64748b;
    margin-top: 4px;
    font-size: 0.875rem;
`;

const EfficiencyScore = styled.div`
    background: #ffffff;
    padding: 14px 22px;
    border-radius: 14px;
    border: 1px solid #a7f3d0;
    background: #ecfdf5;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
`;

const ScoreValue = styled.div`
    font-size: 1.875rem;
    font-weight: 800;
    color: #008060;
    line-height: 1;
`;

const ScoreLabel = styled.div`
    font-size: 0.72rem;
    font-weight: 600;
    color: #065f46;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-top: 4px;
`;

const TopGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
    margin-bottom: 24px;
    @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
    }
`;

const MetricCard = styled.div`
    background: #ffffff;
    padding: 20px;
    border-radius: 14px;
    border: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    animation: ${fadeIn} 0.4s ease-out backwards;
    animation-delay: ${props => props.$delay}s;
    transition: transform 0.15s, box-shadow 0.15s;
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
`;

const IconBox = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: ${props => props.$bg || '#f1f5f9'};
    color: ${props => props.$color || '#008060'};
    display: flex;
    align-items: center;
    justify-content: center;
`;

const MetricContent = styled.div``;
const MetricValue = styled.div`
    font-size: 1.35rem;
    font-weight: 700;
    color: #111827;
`;
const MetricLabel = styled.div`
    font-size: 0.8125rem;
    color: #64748b;
    font-weight: 500;
    margin-top: 2px;
`;

const MainSection = styled.div`
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
    @media (max-width: 1024px) {
        grid-template-columns: 1fr;
    }
`;

const LeftCol = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const RightCol = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const Card = styled.div`
    background: #ffffff;
    border-radius: 14px;
    border: 1px solid #e5e7eb;
    padding: 22px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    animation: ${fadeIn} 0.4s ease-out backwards;
    animation-delay: ${props => props.$delay}s;
`;

const CardHeader = styled.div`
    margin-bottom: 20px;
`;

const CardTitle = styled.h3`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.05rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
`;

const CardSub = styled.p`
    font-size: 0.8125rem;
    color: #64748b;
    margin-top: 4px;
`;

const ChartBox = styled.div`
    height: 280px;
`;

const List = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const ListItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: #f8fafc;
    border-radius: 10px;
    border: 1px solid #f1f5f9;
    animation: ${fadeIn} 0.4s ease-out backwards;
    animation-delay: ${props => props.$delay}s;
    cursor: pointer;
    transition: all 0.15s;
    &:hover {
        background: #ffffff;
        border-color: #e2e8f0;
        box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    }
`;

const TaskInfo = styled.div``;
const TaskTitle = styled.h4`
    font-size: 0.9rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
`;
const TaskMeta = styled.div`
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 4px;
`;

const AICard = styled.div`
    background: #ffffff;
    color: #111827;
    padding: 24px;
    border-radius: 14px;
    border: 1px solid #a7f3d0;
    background: linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%);
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    animation: ${fadeIn} 0.4s ease-out backwards;
    animation-delay: ${props => props.$delay}s;
`;

const AIHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    h3 {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0;
        color: #065f46;
    }
`;

const SparkleIcon = styled.div`
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #008060;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const AIDescription = styled.p`
    font-size: 0.875rem;
    line-height: 1.55;
    color: #374151;
    margin-bottom: 18px;
`;

const NextTaskBox = styled.div`
    background: #ffffff;
    padding: 16px;
    border-radius: 10px;
    border: 1px solid #d1fae5;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
`;

const NextLabel = styled.div`
    font-size: 0.72rem;
    font-weight: 700;
    color: #008060;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
`;

const NextTitle = styled.div`
    font-size: 0.9375rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 12px;
`;

const NextActionBtn = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #111827;
    color: #ffffff;
    border: none;
    padding: 8px 16px;
    border-radius: 9999px;
    font-weight: 500;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.15s;
    &:hover {
        background: #008060;
    }
`;

const AIFooter = styled.div`
    margin-top: 18px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    color: #059669;
`;

const MilestoneCard = styled(Card)``;
const MilestoneList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

const MilestoneItem = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: ${props => props.$completed ? 1 : 0.6};
`;

const MilestoneDot = styled.div`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.$completed ? '#008060' : '#cbd5e1'};
`;

const MilestoneText = styled.span`
    font-size: 0.875rem;
    color: #334155;
    font-weight: 500;
`;

export default PersonalPerformance;
