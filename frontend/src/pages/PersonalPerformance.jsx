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
    LineChart,
    Line,
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

    if (!data) return <p>Failed to load performance data.</p>;

    const { metrics, aiInsights, velocityTrend, topPriorities } = data;

    return (
        <PageContainer>
            <Header>
                <HeaderLeft>
                    <Badge><Star size={12} /> Performance Dashboard</Badge>
                    <Title>My Workspace Insights</Title>
                    <Subtitle>Personal productivity metrics and AI-powered recommendations.</Subtitle>
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
                    <IconBox $color="#6366f1">
                        <CheckCircle2 size={24} />
                    </IconBox>
                    <MetricContent>
                        <MetricValue>{metrics.completedLastMonth}</MetricValue>
                        <MetricLabel>Completed (30d)</MetricLabel>
                    </MetricContent>
                </MetricCard>

                <MetricCard $delay={0.2}>
                    <IconBox $color="#f59e0b">
                        <Clock size={24} />
                    </IconBox>
                    <MetricContent>
                        <MetricValue>{metrics.activeTasks}</MetricValue>
                        <MetricLabel>Active Tasks</MetricLabel>
                    </MetricContent>
                </MetricCard>

                <MetricCard $delay={0.3}>
                    <IconBox $color="#10b981">
                        <Target size={24} />
                    </IconBox>
                    <MetricContent>
                        <MetricValue>{metrics.completionRate}%</MetricValue>
                        <MetricLabel>Completion Rate</MetricLabel>
                    </MetricContent>
                </MetricCard>

                <MetricCard $delay={0.4}>
                    <IconBox $color="#ef4444">
                        <Award size={24} />
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
                            <CardTitle><TrendingUp size={18} /> Productivity Velocity</CardTitle>
                            <CardSub>Tasks completed per week</CardSub>
                        </CardHeader>
                        <ChartBox>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={velocityTrend}>
                                    <defs>
                                        <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorComp)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartBox>
                    </Card>

                    <Card $delay={0.6}>
                        <CardHeader>
                            <CardTitle><LayoutDashboard size={18} /> Top Priorities</CardTitle>
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
                                    <ArrowRight size={18} color="#cbd5e1" />
                                </ListItem>
                            ))}
                        </List>
                    </Card>
                </LeftCol>

                <RightCol>
                    <AICard $delay={0.7}>
                        <AIHeader>
                            <SparkleIcon><Zap size={18} /></SparkleIcon>
                            <h3>AI Workspace Guard</h3>
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
                                <MilestoneDot />
                                <MilestoneText>Complete 5 tasks this week</MilestoneText>
                            </MilestoneItem>
                            <MilestoneItem $completed>
                                <MilestoneDot />
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
const fadeIn = keyframes`from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); }`;
const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

// --- Styled Components ---
const PageContainer = styled.div`
    padding: 32px;
    background: #f8fafc;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
`;

const LoadingContainer = styled.div`
    height: 80vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    color: #64748b;
`;

const Spinner = styled.div`
    width: 40px;
    height: 40px;
    border: 3px solid #e2e8f0;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: ${spin} 1s linear infinite;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
`;

const HeaderLeft = styled.div``;
const HeaderRight = styled.div``;

const Badge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #e0e7ff;
    color: #4338ca;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
`;

const Title = styled.h1`
    font-size: 2.25rem;
    font-weight: 800;
    letter-spacing: -0.025em;
    color: #0f172a;
    margin: 0;
`;

const Subtitle = styled.p`
    color: #64748b;
    margin-top: 4px;
    font-size: 1.1rem;
`;

const EfficiencyScore = styled.div`
    background: white;
    padding: 16px 24px;
    border-radius: 20px;
    border: 3px solid #6366f1;
    text-align: center;
    box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.1);
`;

const ScoreValue = styled.div`
    font-size: 2rem;
    font-weight: 900;
    color: #6366f1;
    line-height: 1;
`;

const ScoreLabel = styled.div`
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    margin-top: 4px;
`;

const TopGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    margin-bottom: 32px;
`;

const MetricCard = styled.div`
    background: white;
    padding: 24px;
    border-radius: 24px;
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 20px;
    animation: ${fadeIn} 0.6s ease-out backwards;
    animation-delay: ${props => props.$delay}s;
    transition: transform 0.2s;
    &:hover { transform: translateY(-4px); }
`;

const IconBox = styled.div`
    width: 56px; height: 56px;
    border-radius: 16px;
    background: ${props => `${props.$color}10`};
    color: ${props => props.$color};
    display: flex; align-items: center; justify-content: center;
`;

const MetricContent = styled.div``;
const MetricValue = styled.div`
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
`;
const MetricLabel = styled.div`
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
`;

const MainSection = styled.div`
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
`;

const LeftCol = styled.div`
    display: flex; flex-direction: column; gap: 24px;
`;

const RightCol = styled.div`
    display: flex; flex-direction: column; gap: 24px;
`;

const Card = styled.div`
    background: white;
    border-radius: 24px;
    border: 1px solid #e2e8f0;
    padding: 24px;
    animation: ${fadeIn} 0.6s ease-out backwards;
    animation-delay: ${props => props.$delay}s;
`;

const CardHeader = styled.div`
    margin-bottom: 24px;
`;

const CardTitle = styled.h3`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.125rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
`;

const CardSub = styled.p`
    font-size: 0.875rem;
    color: #64748b;
    margin-top: 4px;
`;

const ChartBox = styled.div`
    height: 300px;
`;

const List = styled.div`
    display: flex; flex-direction: column; gap: 12px;
`;

const ListItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: #f8fafc;
    border-radius: 16px;
    border: 1px solid #f1f5f9;
    animation: ${fadeIn} 0.5s ease-out backwards;
    animation-delay: ${props => props.$delay}s;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background: #f1f5f9; border-color: #e2e8f0; }
`;

const TaskInfo = styled.div``;
const TaskTitle = styled.h4`
    font-size: 0.9375rem;
    font-weight: 600;
    color: #0f172a;
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
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: white;
    padding: 32px;
    border-radius: 24px;
    position: relative;
    overflow: hidden;
    animation: ${fadeIn} 0.6s ease-out backwards;
    animation-delay: ${props => props.$delay}s;
`;

const AIHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    h3 { font-size: 1.25rem; font-weight: 800; margin: 0; }
`;

const SparkleIcon = styled.div`
    width: 36px; height: 36px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    color: #f59e0b;
    display: flex; align-items: center; justify-content: center;
`;

const AIDescription = styled.p`
    font-size: 0.9375rem;
    line-height: 1.6;
    color: #94a3b8;
    margin-bottom: 24px;
`;

const NextTaskBox = styled.div`
    background: rgba(255, 255, 255, 0.05);
    padding: 20px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const NextLabel = styled.div`
    font-size: 0.75rem;
    font-weight: 700;
    color: #6366f1;
    text-transform: uppercase;
    margin-bottom: 8px;
`;

const NextTitle = styled.div`
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 16px;
`;

const NextActionBtn = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    background: #6366f1;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    &:hover { background: #4f46e5; }
`;

const AIFooter = styled.div`
    margin-top: 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.7rem;
    color: #475569;
`;

const MilestoneCard = styled(Card)``;
const MilestoneList = styled.div`
    display: flex; flex-direction: column; gap: 16px;
`;

const MilestoneItem = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: ${props => props.$completed ? 1 : 0.6};
`;

const MilestoneDot = styled.div`
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #6366f1;
`;

const MilestoneText = styled.span`
    font-size: 0.875rem;
    color: #334155;
    text-decoration: ${props => props.$completed ? 'none' : 'none'};
`;

export default PersonalPerformance;
