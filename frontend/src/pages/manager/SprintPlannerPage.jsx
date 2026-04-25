import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styled, { keyframes } from 'styled-components';
import {
    Zap, ChevronRight, ChevronDown, Calendar, Users, Target, AlertTriangle,
    CheckCircle2, Clock, BarChart3, Sparkles, Play, RotateCcw, Download,
    ArrowRight, User, Flag, Lightbulb, Shield, TrendingUp, ListChecks
} from 'lucide-react';

// ─── Priority Colours ─────────────────────────────────────
// ─── Priority Colours (IBM Carbon) ────────────────────────
const PRIORITY_MAP = {
    critical: { color: '#da1e28', bg: 'rgba(218,30,40,0.1)', label: 'Critical' }, // Red 60
    high:     { color: '#ff832b', bg: 'rgba(255,131,43,0.1)', label: 'High' },     // Orange 40
    medium:   { color: '#0f62fe', bg: 'rgba(15,98,254,0.1)', label: 'Medium' },   // Blue 60
    low:      { color: '#8d8d8d', bg: 'rgba(141,141,141,0.1)', label: 'Low' },    // Gray 50
};

const RISK_MAP = {
    low:    { color: '#24a148', label: 'Low Risk', icon: Shield },      // Green 60
    medium: { color: '#f1c21b', label: 'Medium Risk', icon: AlertTriangle }, // Yellow 30
    high:   { color: '#da1e28', label: 'High Risk', icon: AlertTriangle },   // Red 60
};

// ─── Component ────────────────────────────────────────────
const SprintPlannerPage = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [sprintWeeks, setSprintWeeks] = useState(2);
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [plan, setPlan] = useState(null);
    const [projectMeta, setProjectMeta] = useState(null);
    const [expandedSprints, setExpandedSprints] = useState({});
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/sprint-planner/projects')
            .then(res => {
                const data = res.data?.data || [];
                setProjects(data);
                if (data.length > 0) setSelectedProject(data[0]._id);
            })
            .catch(() => setError('Could not load projects'))
            .finally(() => setLoadingProjects(false));
    }, []);

    const handleGenerate = async () => {
        if (!selectedProject) return;
        setLoading(true);
        setError('');
        setPlan(null);
        try {
            const res = await api.post('/sprint-planner/generate', {
                projectId: selectedProject,
                sprintDurationWeeks: sprintWeeks,
                startDate
            });
            const data = res.data?.data;
            setPlan(data.plan);
            setProjectMeta(data);
            // Expand first sprint by default
            if (data.plan?.sprints?.length > 0) {
                setExpandedSprints({ 0: true });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate sprint plan. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSprint = (i) =>
        setExpandedSprints(prev => ({ ...prev, [i]: !prev[i] }));

    const downloadCSV = () => {
        if (!plan || !plan.sprints) return;

        const headers = ['Sprint', 'Start Date', 'End Date', 'Goal', 'Task Title', 'Assignee', 'Priority', 'Hours', 'AI Reason'];
        let csvContent = headers.join(',') + '\n';

        plan.sprints.forEach(sprint => {
            sprint.tasks.forEach(task => {
                const row = [
                    sprint.name,
                    sprint.startDate,
                    sprint.endDate,
                    `"${(sprint.goal || '').replace(/"/g, '""')}"`,
                    `"${(task.taskTitle || '').replace(/"/g, '""')}"`,
                    task.assignedTo || 'Unassigned',
                    task.priority || 'medium',
                    task.estimatedHours || 0,
                    `"${(task.reason || '').replace(/"/g, '""')}"`
                ];
                csvContent += row.join(',') + '\n';
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `sprint-plan-${selectedProject}-${startDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const riskInfo = plan ? RISK_MAP[plan.riskLevel] || RISK_MAP.low : null;

    return (
        <PageContainer>
            {/* Hero Header */}
            <Hero>
                <HeroLeft>
                    <HeroBadge>
                        <Sparkles size={14} />
                        AI-Powered
                    </HeroBadge>
                    <HeroTitle>Sprint Planner</HeroTitle>
                    <HeroSub>
                        Feed in your project's open tasks — the AI analyzes your team's workload,
                        task complexity, and priorities to generate an optimal sprint schedule.
                    </HeroSub>
                </HeroLeft>
                <HeroIcon>
                    <Zap size={52} />
                </HeroIcon>
            </Hero>

            <MainLayout>
                {/* Config Panel */}
                <ConfigPanel>
                    <PanelTitle>
                        <Target size={18} />
                        Configure Sprint
                    </PanelTitle>

                    <FieldGroup>
                        <Label>Project</Label>
                        {loadingProjects ? (
                            <SkeletonInput />
                        ) : (
                            <Select
                                value={selectedProject}
                                onChange={e => setSelectedProject(e.target.value)}
                            >
                                {projects.map(p => (
                                    <option key={p._id} value={p._id}>
                                        {p.name} {p.status === 'active' ? '🟢' : ''}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </FieldGroup>

                    <FieldGroup>
                        <Label>Sprint Duration</Label>
                        <DurationSelector>
                            {[1, 2, 3, 4].map(w => (
                                <DurationBtn
                                    key={w}
                                    $active={sprintWeeks === w}
                                    onClick={() => setSprintWeeks(w)}
                                >
                                    {w}w
                                </DurationBtn>
                            ))}
                        </DurationSelector>
                    </FieldGroup>

                    <FieldGroup>
                        <Label>Sprint Start Date</Label>
                        <DateInput
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </FieldGroup>

                    <GenerateBtn onClick={handleGenerate} disabled={loading || !selectedProject}>
                        {loading ? (
                            <>
                                <Spinner />
                                Analyzing tasks...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Generate Plan
                            </>
                        )}
                    </GenerateBtn>

                    {plan && (
                        <SecondaryBtn onClick={() => { setPlan(null); setProjectMeta(null); }}>
                            <RotateCcw size={16} />
                            Reset
                        </SecondaryBtn>
                    )}

                    {plan && (
                        <SecondaryBtn onClick={downloadCSV}>
                            <Download size={16} />
                            Export CSV
                        </SecondaryBtn>
                    )}

                    {error && <ErrorMsg>{error}</ErrorMsg>}

                    {/* How It Works */}
                    <HowItWorks>
                        <HowTitle>How it works</HowTitle>
                        <HowStep>
                            <HowNum>1</HowNum>
                            Fetches all open tasks in the project
                        </HowStep>
                        <HowStep>
                            <HowNum>2</HowNum>
                            Checks team member workload
                        </HowStep>
                        <HowStep>
                            <HowNum>3</HowNum>
                            AI assigns tasks by priority & capacity
                        </HowStep>
                        <HowStep>
                            <HowNum>4</HowNum>
                            Flags risks and gives recommendations
                        </HowStep>
                    </HowItWorks>
                </ConfigPanel>

                {/* Results Area */}
                <ResultsArea>
                    {!plan && !loading && (
                        <EmptyState>
                            <EmptyIcon>
                                <ListChecks size={64} />
                            </EmptyIcon>
                            <h3>Configure &amp; Generate</h3>
                            <p>Select a project, set your sprint duration, and let AI plan your sprint.</p>
                        </EmptyState>
                    )}

                    {loading && (
                        <ThinkingCard>
                            <ThinkingAnim />
                            <ThinkingText>
                                <strong>AI is analyzing {projectMeta?.taskCount || ''} tasks...</strong>
                                <span>Evaluating priorities, team capacity, and optimal assignment order</span>
                            </ThinkingText>
                        </ThinkingCard>
                    )}

                    {plan && (
                        <>
                            {/* Summary Row */}
                            <SummaryRow>
                                <SummaryCard>
                                    <SummaryIcon $color="#6366f1"><BarChart3 size={20} /></SummaryIcon>
                                    <SummaryData>
                                        <SummaryNum>{projectMeta?.taskCount}</SummaryNum>
                                        <SummaryLabel>Tasks Analyzed</SummaryLabel>
                                    </SummaryData>
                                </SummaryCard>
                                <SummaryCard>
                                    <SummaryIcon $color="#10b981"><Clock size={20} /></SummaryIcon>
                                    <SummaryData>
                                        <SummaryNum>{plan.totalPoints}h</SummaryNum>
                                        <SummaryLabel>Total Effort</SummaryLabel>
                                    </SummaryData>
                                </SummaryCard>
                                <SummaryCard>
                                    <SummaryIcon $color="#f97316"><TrendingUp size={20} /></SummaryIcon>
                                    <SummaryData>
                                        <SummaryNum>{plan.utilizationPct}%</SummaryNum>
                                        <SummaryLabel>Team Utilization</SummaryLabel>
                                    </SummaryData>
                                </SummaryCard>
                                <SummaryCard>
                                    <SummaryIcon $color="#f59e0b"><Users size={20} /></SummaryIcon>
                                    <SummaryData>
                                        <SummaryNum>{projectMeta?.memberCount}</SummaryNum>
                                        <SummaryLabel>Team Members</SummaryLabel>
                                    </SummaryData>
                                </SummaryCard>
                            </SummaryRow>

                            {/* Utilization Bar */}
                            <UtilBar>
                                <UtilBarFill $pct={Math.min(plan.utilizationPct, 100)} $overloaded={plan.utilizationPct > 90} />
                            </UtilBar>
                            <UtilLabel>
                                <span>Team Capacity Used: <strong>{plan.utilizationPct}%</strong></span>
                                <span>{plan.teamCapacity}h total capacity</span>
                            </UtilLabel>

                            {/* AI Summary */}
                            <AISummaryCard>
                                <AISummaryHeader>
                                    <Sparkles size={16} />
                                    AI Analysis
                                </AISummaryHeader>
                                <p>{plan.summary}</p>
                            </AISummaryCard>

                            {/* Risk Banner */}
                            {riskInfo && (
                                <RiskBanner $color={riskInfo.color}>
                                    <riskInfo.icon size={18} />
                                    <strong>{riskInfo.label}</strong>
                                    {plan.risks?.[0] && <span> — {plan.risks[0]}</span>}
                                </RiskBanner>
                            )}

                            {/* Sprints */}
                            <SectionTitle><Play size={16} /> Sprint Breakdown</SectionTitle>
                            {plan.sprints?.map((sprint, i) => (
                                <SprintCard key={i}>
                                    <SprintHeader onClick={() => toggleSprint(i)}>
                                        <SprintLeft>
                                            <SprintName>{sprint.name}</SprintName>
                                            <SprintDates>
                                                <Calendar size={13} />
                                                {sprint.startDate} → {sprint.endDate}
                                            </SprintDates>
                                        </SprintLeft>
                                        <SprintRight>
                                            <SprintGoalBadge>{sprint.goal}</SprintGoalBadge>
                                            <TaskCount>{sprint.tasks?.length} tasks</TaskCount>
                                            {expandedSprints[i] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        </SprintRight>
                                    </SprintHeader>

                                    {expandedSprints[i] && (
                                        <SprintTaskList>
                                            {sprint.tasks?.map((task, j) => {
                                                const p = PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium;
                                                return (
                                                    <TaskRow key={j}>
                                                        <PriorityDot $color={p.color} />
                                                        <TaskInfo>
                                                            <TaskName>{task.taskTitle}</TaskName>
                                                            <TaskReason>{task.reason}</TaskReason>
                                                        </TaskInfo>
                                                        <TaskBadges>
                                                            <PriorityBadge $color={p.color} $bg={p.bg}>
                                                                <Flag size={11} />
                                                                {p.label}
                                                            </PriorityBadge>
                                                            <AssigneeBadge>
                                                                <User size={11} />
                                                                {task.assignedTo}
                                                            </AssigneeBadge>
                                                            {task.estimatedHours > 0 && (
                                                                <HoursBadge>
                                                                    <Clock size={11} />
                                                                    {task.estimatedHours}h
                                                                </HoursBadge>
                                                            )}
                                                        </TaskBadges>
                                                    </TaskRow>
                                                );
                                            })}
                                        </SprintTaskList>
                                    )}
                                </SprintCard>
                            ))}

                            {/* Unscheduled */}
                            {plan.unscheduled?.length > 0 && (
                                <UnscheduledSection>
                                    <SectionTitle style={{ color: '#f59e0b' }}>
                                        <AlertTriangle size={16} /> Unscheduled ({plan.unscheduled.length})
                                    </SectionTitle>
                                    <UnscheduledList>
                                        {plan.unscheduled.map((t, i) => (
                                            <UnscheduledItem key={i}>{t}</UnscheduledItem>
                                        ))}
                                    </UnscheduledList>
                                </UnscheduledSection>
                            )}

                            {/* Recommendations */}
                            {plan.recommendations?.length > 0 && (
                                <>
                                    <SectionTitle><Lightbulb size={16} /> AI Recommendations</SectionTitle>
                                    <RecommendationsList>
                                        {plan.recommendations.map((r, i) => (
                                            <RecommendationItem key={i}>
                                                <ArrowRight size={14} />
                                                {r}
                                            </RecommendationItem>
                                        ))}
                                    </RecommendationsList>
                                </>
                            )}
                        </>
                    )}
                </ResultsArea>
            </MainLayout>
        </PageContainer>
    );
};

// ─── Animations ───────────────────────────────────────────
const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
`;

const thinking = keyframes`
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.3); }
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const shimmer = keyframes`
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
`;

// ─── Styled Components ────────────────────────────────────

const PageContainer = styled.div`
    padding: 40px;
    max-width: 1400px;
    margin: 0 auto;
    min-height: 100vh;
    background: ${p => p.theme.bg.primary};
    font-family: 'IBM Plex Sans', sans-serif;
`;

const Hero = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 48px;
    animation: ${fadeUp} 0.6s ease-out;
`;

const HeroLeft = styled.div`
    flex: 1;
`;

const HeroBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 0; /* Carbon */
    background: ${p => p.theme.mode === 'dark' ? 'rgba(15,98,254,0.2)' : '#edf5ff'};
    color: #0f62fe;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 16px;
    border: 1px solid #0f62fe;
`;

const HeroTitle = styled.h1`
    font-size: 3.5rem;
    font-weight: 300; /* Carbon */
    color: ${p => p.theme.text.primary};
    letter-spacing: -0.01em;
    margin-bottom: 12px;
    line-height: 1.1;
`;

const HeroSub = styled.p`
    font-size: 1rem;
    color: ${p => p.theme.text.secondary};
    max-width: 520px;
    line-height: 1.6;
`;

const HeroIcon = styled.div`
    width: 100px;
    height: 100px;
    border-radius: 0; /* Carbon */
    background: #0f62fe; /* Carbon Blue */
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: none;
    flex-shrink: 0;
`;

const MainLayout = styled.div`
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 32px;
    align-items: start;

    @media (max-width: 1024px) {
        grid-template-columns: 1fr;
    }
`;

const ConfigPanel = styled.div`
    background: ${p => p.theme.bg.card};
    border: 1px solid ${p => p.theme.border};
    border-radius: 0; /* Carbon */
    padding: 28px;
    position: sticky;
    top: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-shadow: none;
`;

const PanelTitle = styled.h3`
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1rem;
    font-weight: 700;
    color: ${p => p.theme.text.primary};
    margin: 0;
`;

const FieldGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const Label = styled.label`
    font-size: 0.8125rem;
    font-weight: 600;
    color: ${p => p.theme.text.secondary};
    text-transform: uppercase;
    letter-spacing: 0.04em;
`;

const Select = styled.select`
    width: 100%;
    padding: 10px 14px;
    border-radius: 0; /* Carbon */
    border: 1px solid ${p => p.theme.border};
    border-bottom: 2px solid ${p => p.theme.border}; /* Carbon accent */
    background: ${p => p.theme.bg.secondary};
    color: ${p => p.theme.text.primary};
    font-size: 0.9375rem;
    cursor: pointer;
    outline: none;
    transition: all 0.2s;

    &:focus { border-bottom-color: #0f62fe; }
`;

const DurationSelector = styled.div`
    display: flex;
    gap: 8px;
`;

const DurationBtn = styled.button`
    flex: 1;
    padding: 9px;
    border-radius: 0; /* Carbon */
    border: 1px solid ${p => p.$active ? '#0f62fe' : p.theme.border};
    background: ${p => p.$active ? '#0f62fe' : 'transparent'};
    color: ${p => p.$active ? 'white' : p.theme.text.secondary};
    font-weight: 400;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover { border-color: #0f62fe; color: ${p => p.$active ? 'white' : '#0f62fe'}; }
`;

const DateInput = styled.input`
    width: 100%;
    padding: 10px 14px;
    border-radius: 0; /* Carbon */
    border: 1px solid ${p => p.theme.border};
    border-bottom: 2px solid ${p => p.theme.border};
    background: ${p => p.theme.bg.secondary};
    color: ${p => p.theme.text.primary};
    font-size: 0.9375rem;
    outline: none;
    box-sizing: border-box;

    &:focus { border-bottom-color: #0f62fe; }
`;

const GenerateBtn = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 14px;
    background: #0f62fe; /* Carbon Blue */
    color: white;
    border: none;
    border-radius: 0; /* Carbon */
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: none;

    &:hover:not(:disabled) {
        background: #0043ce;
    }

    &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const SecondaryBtn = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 11px;
    background: transparent;
    color: ${p => p.theme.text.secondary};
    border: 1px solid ${p => p.theme.border};
    border-radius: 0; /* Carbon */
    font-size: 0.875rem;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s;

    &:hover { background: ${p => p.theme.bg.hover}; color: ${p => p.theme.text.primary}; border-color: #0f62fe; }
`;

const Spinner = styled.div`
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: ${spin} 0.8s linear infinite;
`;

const ErrorMsg = styled.div`
    padding: 12px;
    border-radius: 10px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #ef4444;
    font-size: 0.8125rem;
    font-weight: 500;
`;

const HowItWorks = styled.div`
    border-top: 1px solid ${p => p.theme.border};
    padding-top: 16px;
`;

const HowTitle = styled.div`
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${p => p.theme.text.tertiary};
    margin-bottom: 12px;
`;

const HowStep = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 0.8125rem;
    color: ${p => p.theme.text.secondary};
    margin-bottom: 8px;
`;

const HowNum = styled.div`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(99, 102, 241, 0.15);
    color: #6366f1;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
`;

const SkeletonInput = styled.div`
    height: 42px;
    border-radius: 10px;
    background: linear-gradient(90deg, ${p => p.theme.bg.tertiary} 25%, ${p => p.theme.bg.secondary} 50%, ${p => p.theme.bg.tertiary} 75%);
    background-size: 400px 100%;
    animation: ${shimmer} 1.5s infinite;
`;

// ─── Results ──────────────────────────────────────────────

const ResultsArea = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    animation: ${fadeUp} 0.5s ease-out;
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 80px 40px;
    background: ${p => p.theme.bg.card};
    border-radius: 0; /* Carbon */
    border: 1px dashed ${p => p.theme.border};
    color: ${p => p.theme.text.secondary};

    h3 { font-size: 1.25rem; margin-bottom: 8px; color: ${p => p.theme.text.primary}; font-weight: 400; }
    p { font-size: 0.9375rem; }
`;

const EmptyIcon = styled.div`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 0; /* Carbon */
    background: ${p => p.theme.bg.tertiary};
    color: ${p => p.theme.text.tertiary};
    margin-bottom: 20px;
    border: 1px solid ${p => p.theme.border};
`;

const ThinkingCard = styled.div`
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 32px;
    background: ${p => p.theme.bg.card};
    border-radius: 0; /* Carbon */
    border: 1px solid ${p => p.theme.border};
`;

const ThinkingAnim = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #0f62fe; /* Carbon Blue */
    flex-shrink: 0;
    animation: ${thinking} 1.4s ease-in-out infinite;
`;

const ThinkingText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    strong { font-size: 1rem; color: ${p => p.theme.text.primary}; }
    span { font-size: 0.875rem; color: ${p => p.theme.text.secondary}; }
`;

const SummaryRow = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;

    @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
`;

const SummaryCard = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: ${p => p.theme.bg.card};
    border-radius: 0; /* Carbon */
    border: 1px solid ${p => p.theme.border};
`;

const SummaryIcon = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 0; /* Carbon */
    background: transparent;
    color: ${p => p.$color};
    border: 1px solid ${p => p.$color};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
`;

const SummaryData = styled.div`
    display: flex;
    flex-direction: column;
`;

const SummaryNum = styled.div`
    font-size: 1.5rem;
    font-weight: 800;
    color: ${p => p.theme.text.primary};
    line-height: 1;
`;

const SummaryLabel = styled.div`
    font-size: 0.75rem;
    color: ${p => p.theme.text.secondary};
    margin-top: 2px;
`;

const UtilBar = styled.div`
    height: 8px;
    border-radius: 100px;
    background: ${p => p.theme.bg.tertiary};
    overflow: hidden;
`;

const UtilBarFill = styled.div`
    height: 100%;
    width: ${p => p.$pct}%;
    border-radius: 0;
    background: ${p => p.$overloaded
        ? '#da1e28'
        : '#0f62fe'};
    transition: width 1s cubic-bezier(0.2, 0.8, 0.2, 1);
`;

const UtilLabel = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 0.8125rem;
    color: ${p => p.theme.text.secondary};
    margin-top: 6px;
    strong { color: ${p => p.theme.text.primary}; }
`;

const AISummaryCard = styled.div`
    padding: 20px 24px;
    background: ${p => p.theme.bg.tertiary};
    border: 1px solid ${p => p.theme.border};
    border-left: 4px solid #0f62fe; /* Carbon focus indicator */
    border-radius: 0; /* Carbon */
    color: ${p => p.theme.text.primary};
    font-size: 0.9375rem;
    line-height: 1.6;

    p { margin: 0; }
`;

const AISummaryHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #0f62fe;
    margin-bottom: 10px;
`;

const RiskBanner = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    border-radius: 0; /* Carbon */
    background: ${p => p.theme.bg.card};
    border: 1px solid ${p => p.$color};
    border-left: 4px solid ${p => p.$color};
    color: ${p => p.$color};
    font-size: 0.9375rem;
    font-weight: 400;

    strong { font-weight: 700; }
    span { font-weight: 400; color: ${p => p.theme.text.secondary}; }
`;

const SectionTitle = styled.h3`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1rem;
    font-weight: 700;
    color: ${p => p.theme.text.primary};
    margin: 8px 0 4px;
`;

const SprintCard = styled.div`
    background: ${p => p.theme.bg.card};
    border: 1px solid ${p => p.theme.border};
    border-radius: 0; /* Carbon */
    overflow: hidden;
    transition: background 0.2s;

    &:hover { background: ${p => p.theme.bg.tertiary}; }
`;

const SprintHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    cursor: pointer;
    gap: 16px;
    user-select: none;

    &:hover { background: ${p => p.theme.bg.hover}; }
`;

const SprintLeft = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const SprintName = styled.div`
    font-size: 1rem;
    font-weight: 700;
    color: ${p => p.theme.text.primary};
`;

const SprintDates = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8125rem;
    color: ${p => p.theme.text.secondary};
`;

const SprintRight = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    color: ${p => p.theme.text.tertiary};
`;

const SprintGoalBadge = styled.div`
    font-size: 0.8125rem;
    color: ${p => p.theme.text.secondary};
    background: ${p => p.theme.bg.primary};
    padding: 4px 12px;
    border-radius: 0; /* Carbon */
    border: 1px solid ${p => p.theme.border};
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const TaskCount = styled.div`
    font-size: 0.8125rem;
    font-weight: 600;
    color: #0f62fe;
    white-space: nowrap;
`;

const SprintTaskList = styled.div`
    border-top: 1px solid ${p => p.theme.border};
    padding: 8px 0;
`;

const TaskRow = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 14px 24px;
    border-bottom: 1px solid ${p => p.theme.border};
    transition: background 0.15s;

    &:last-child { border-bottom: none; }
    &:hover { background: ${p => p.theme.bg.hover}; }
`;

const PriorityDot = styled.div`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${p => p.$color};
    margin-top: 6px;
    flex-shrink: 0;
`;

const TaskInfo = styled.div`
    flex: 1;
    min-width: 0;
`;

const TaskName = styled.div`
    font-size: 0.9375rem;
    font-weight: 600;
    color: ${p => p.theme.text.primary};
    margin-bottom: 4px;
`;

const TaskReason = styled.div`
    font-size: 0.8125rem;
    color: ${p => p.theme.text.tertiary};
    line-height: 1.4;
`;

const TaskBadges = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex-shrink: 0;
`;

const PriorityBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 0; /* Carbon */
    font-size: 0.75rem;
    font-weight: 600;
    color: ${p => p.$color};
    background: ${p => p.$bg};
    border: 1px solid ${p => p.$color};
`;

const AssigneeBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 0; /* Carbon */
    font-size: 0.75rem;
    font-weight: 400;
    color: ${p => p.theme.text.secondary};
    background: ${p => p.theme.bg.tertiary};
    border: 1px solid ${p => p.theme.border};
`;

const HoursBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 0; /* Carbon */
    font-size: 0.75rem;
    font-weight: 600;
    color: #24a148;
    background: rgba(36, 161, 72, 0.1);
    border: 1px solid #24a148;
`;

const UnscheduledSection = styled.div`
    background: ${p => p.theme.bg.card};
    border: 1px solid ${p => p.theme.mode === 'dark' ? 'rgba(241,194,27,0.25)' : '#f1c21b'};
    border-bottom: 4px solid #f1c21b;
    border-radius: 0; /* Carbon */
    padding: 20px 24px;
`;

const UnscheduledList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
`;

const UnscheduledItem = styled.div`
    padding: 10px 14px;
    background: ${p => p.theme.bg.tertiary};
    border-radius: 0; /* Carbon */
    font-size: 0.875rem;
    color: ${p => p.theme.text.secondary};
    border: 1px solid ${p => p.theme.border};

    &::before { content: '·'; margin-right: 8px; color: #f1c21b; font-weight: 900; }
`;

const RecommendationsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const RecommendationItem = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 18px;
    background: ${p => p.theme.bg.card};
    border: 1px solid ${p => p.theme.border};
    border-radius: 0; /* Carbon */
    font-size: 0.9375rem;
    color: ${p => p.theme.text.secondary};
    line-height: 1.5;

    svg { color: #0f62fe; flex-shrink: 0; margin-top: 2px; }
`;

export default SprintPlannerPage;
