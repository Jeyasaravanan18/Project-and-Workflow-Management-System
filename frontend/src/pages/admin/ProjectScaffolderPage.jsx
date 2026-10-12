import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import {
    Sparkles, Loader2, CheckCircle2, ArrowRight, FolderPlus,
    Layers, Clock, ShieldCheck, Cpu, Lightbulb, Compass, ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import GetStartedWidget from '../../components/GetStartedWidget';

const TEMPLATE_PROMPTS = [
    {
        icon: '📱',
        label: 'E-Commerce Mobile App',
        desc: 'Build an iOS/Android e-commerce application with product catalog, cart checkout with Stripe, order tracking, and push notifications.'
    },
    {
        icon: '🔒',
        label: 'SOC2 Security Audit',
        desc: 'Execute SOC2 Type II compliance audit including access controls review, audit logging infrastructure, vulnerability scans, and policy documents.'
    },
    {
        icon: '💳',
        label: 'Fintech Wallet & KYC',
        desc: 'Develop a digital wallet with customer KYC verification, ACH bank transfers, transaction history, fraud detection rules, and exportable statements.'
    },
    {
        icon: '🤖',
        label: 'AI Customer Support Hub',
        desc: 'Create an omnichannel customer service portal with ticket triage, automated AI responses, Zendesk integration, and agent SLA analytics.'
    }
];

const ProjectScaffolderPage = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [description, setDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            const data = response.data.data || [];
            setProjects(data);
            if (data.length > 0) {
                setSelectedProject(data[0]._id);
            }
        } catch (error) {
            toast.error('Failed to fetch projects');
            console.error(error);
        }
    };

    const handleSelectTemplate = (templateDesc) => {
        setDescription(templateDesc);
    };

    const handleGenerate = async () => {
        if (!selectedProject) {
            toast.error('Please select a target project');
            return;
        }
        if (!description.trim()) {
            toast.error('Please enter a project description');
            return;
        }

        setIsGenerating(true);
        setResult(null);

        try {
            const response = await api.post(`/projects/${selectedProject}/scaffold`, {
                description
            });

            if (response.data.success) {
                toast.success('Project scaffolded successfully!');
                setResult(response.data);
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to scaffold project';
            toast.error(msg);
            console.error('Scaffold error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const selectedProjectObj = projects.find(p => p._id === selectedProject);

    return (
        <PageContainer>
            {/* Onboarding / Getting Started Widget Requested by User */}
            <GetStartedWidget
                title="Get started with ProjectFlow"
                actionText="Create project"
                actionPath="/projects"
                steps={[
                    {
                        number: '1',
                        title: 'Add your first project',
                        description: 'Create a project, assign team members, and track workflows in real time.',
                        linkText: 'Create your project',
                        linkPath: '/projects'
                    },
                    {
                        number: '2',
                        title: 'Create your automations',
                        description: 'Set up automated triggers and notifications to streamline approvals.',
                        linkText: 'Explore automations',
                        linkPath: '/admin/automations'
                    }
                ]}
            />

            {/* AI Scaffolder Main Section */}
            <ArchitectHeader>
                <Badge>
                    <Sparkles size={13} />
                    <span>AI Project Architect</span>
                </Badge>
                <Title>Automated Project Scaffolder</Title>
                <Subtitle>
                    Transform your raw requirements and PRDs into structured agile modules, tasks, and role allocations in seconds.
                </Subtitle>
            </ArchitectHeader>

            <GridContainer>
                {/* Left / Main Architect Form */}
                <MainCard>
                    <CardHeader>
                        <CardTitleSection>
                            <CardIconBox>
                                <Cpu size={20} />
                            </CardIconBox>
                            <div>
                                <CardTitle>Architecture Generator</CardTitle>
                                <CardSub>Select target project and describe scope</CardSub>
                            </div>
                        </CardTitleSection>
                    </CardHeader>

                    <FormBody>
                        <FormGroup>
                            <LabelRow>
                                <Label htmlFor="projectSelect">Target Project *</Label>
                                <CreateNewLink onClick={() => navigate('/projects')}>
                                    <FolderPlus size={13} />
                                    <span>New project</span>
                                </CreateNewLink>
                            </LabelRow>
                            <Select
                                id="projectSelect"
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                disabled={isGenerating}
                            >
                                <option value="">-- Choose a target project --</option>
                                {projects.map((p) => (
                                    <option key={p._id} value={p._id}>
                                        {p.name} {p.key ? `(${p.key})` : ''}
                                    </option>
                                ))}
                            </Select>
                            <HelperText>
                                The AI will create and assign all generated modules directly into this project.
                            </HelperText>
                        </FormGroup>

                        {/* Quick Prompt Templates */}
                        <FormGroup>
                            <LabelRow>
                                <Label>Inspiration Templates</Label>
                                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Click to apply</span>
                            </LabelRow>
                            <TemplateChipsGrid>
                                {TEMPLATE_PROMPTS.map((t, idx) => (
                                    <TemplateChip key={idx} onClick={() => handleSelectTemplate(t.desc)}>
                                        <span className="icon">{t.icon}</span>
                                        <span className="label">{t.label}</span>
                                    </TemplateChip>
                                ))}
                            </TemplateChipsGrid>
                        </FormGroup>

                        <FormGroup>
                            <LabelRow>
                                <Label htmlFor="description">Requirements & Functional Scope *</Label>
                                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{description.length} chars</span>
                            </LabelRow>
                            <TextArea
                                id="description"
                                placeholder="Describe the project goals, key epics, modules, dependencies, and target roles in plain language..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isGenerating}
                                rows={6}
                            />
                            <HelperText>
                                Tip: Mention milestone goals, priority areas, and specialized team roles for higher accuracy.
                            </HelperText>
                        </FormGroup>

                        <GenerateBtn
                            onClick={handleGenerate}
                            disabled={isGenerating || !selectedProject || !description.trim()}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="spin" />
                                    <span>Synthesizing Architecture & Creating Tasks...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    <span>Generate & Scaffold Project</span>
                                </>
                            )}
                        </GenerateBtn>
                    </FormBody>
                </MainCard>

                {/* Right / Guidance Sidebar */}
                <SidebarCard>
                    <SidebarTitle>
                        <Compass size={18} />
                        <span>How AI Scaffolding Works</span>
                    </SidebarTitle>

                    <StepsList>
                        <StepItem>
                            <StepIndex>1</StepIndex>
                            <div>
                                <StepHeading>Requirements Analysis</StepHeading>
                                <StepSub>Natural language parsing extracts key functional components and dependencies.</StepSub>
                            </div>
                        </StepItem>
                        <StepItem>
                            <StepIndex>2</StepIndex>
                            <div>
                                <StepHeading>Module Decomposition</StepHeading>
                                <StepSub>Groups logic into logical sprints and milestones with priority weights.</StepSub>
                            </div>
                        </StepItem>
                        <StepItem>
                            <StepIndex>3</StepIndex>
                            <div>
                                <StepHeading>Actionable Tasks</StepHeading>
                                <StepSub>Estimates hours and creates ready-to-assign tasks directly inside your workspace.</StepSub>
                            </div>
                        </StepItem>
                    </StepsList>

                    <TipsBox>
                        <Lightbulb size={16} />
                        <div>
                            <strong>Best Practices</strong>
                            <p>Mention technical constraints (e.g. React, PostgreSQL, Docker) so the engine generates specific developer deliverables.</p>
                        </div>
                    </TipsBox>
                </SidebarCard>
            </GridContainer>

            {/* Scaffolding Output Results */}
            {result && (
                <ResultCard>
                    <ResultHeader>
                        <CheckCircle2 size={24} color="#10B981" />
                        <div>
                            <ResultTitle>Architecture Generated Successfully</ResultTitle>
                            <ResultSub>
                                Modules and tasks have been structured and saved to <strong>{selectedProjectObj?.name || 'your project'}</strong>.
                            </ResultSub>
                        </div>
                    </ResultHeader>

                    {result.summary && (
                        <SummaryCallout>
                            "{result.summary}"
                        </SummaryCallout>
                    )}

                    <StatsGrid>
                        <ResultStat>
                            <div className="icon"><Layers size={20} /></div>
                            <div className="label">Modules Created</div>
                            <div className="value">{result.stats?.modulesCreated || result.modules?.length || 0}</div>
                        </ResultStat>
                        <ResultStat>
                            <div className="icon"><ShieldCheck size={20} /></div>
                            <div className="label">Tasks Created</div>
                            <div className="value">{result.stats?.tasksCreated || 0}</div>
                        </ResultStat>
                    </StatsGrid>

                    {result.modules && result.modules.length > 0 && (
                        <ModuleListContainer>
                            <ModuleListTitle>Generated Modules & Tasks</ModuleListTitle>
                            {result.modules.map((mod, idx) => (
                                <ModuleItem key={idx}>
                                    <ModuleHeader>
                                        <Layers size={16} color="#1E40AF" />
                                        <span>{mod.name}</span>
                                        <ModuleBadge>{mod.tasks?.length || 0} tasks</ModuleBadge>
                                    </ModuleHeader>
                                    <TaskList>
                                        {mod.tasks?.map((t, tIdx) => (
                                            <TaskItem key={tIdx}>
                                                <CheckCircle2 size={14} color="#1E40AF" />
                                                <span className="task-title">{t.title}</span>
                                                <span className={`priority ${t.priority?.toLowerCase()}`}>{t.priority}</span>
                                                {t.estimatedHours && (
                                                    <span className="hours">
                                                        <Clock size={12} /> {t.estimatedHours}h
                                                    </span>
                                                )}
                                            </TaskItem>
                                        ))}
                                    </TaskList>
                                </ModuleItem>
                            ))}
                        </ModuleListContainer>
                    )}

                    <ViewProjectBtn onClick={() => navigate(`/projects/${selectedProject}`)}>
                        <span>Open Project Dashboard</span>
                        <ArrowRight size={16} />
                    </ViewProjectBtn>
                </ResultCard>
            )}
        </PageContainer>
    );
};

export default ProjectScaffolderPage;

// ─── Animations ─────────────────────────────────────────────────────────────
const spin = keyframes`
    from { transform: rotate(0deg); } to { transform: rotate(360deg); }
`;
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); }
`;

// ─── Layout & Page Containers ────────────────────────────────────────────────
const PageContainer = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    padding: 8px 0 40px 0;
    animation: ${fadeIn} 0.3s ease-out;
`;

const ArchitectHeader = styled.div`
    margin-bottom: 24px;
`;

const Badge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: ${props => props.theme.mode === 'dark' ? 'rgba(30, 64, 175, 0.25)' : '#EFF6FF'};
    color: ${props => props.theme.mode === 'dark' ? '#93C5FD' : '#1E40AF'};
    border: 1px solid ${props => props.theme.mode === 'dark' ? '#1E40AF' : '#BFDBFE'};
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 10px;
`;

const Title = styled.h1`
    font-size: 1.75rem;
    color: ${props => props.theme.text.primary};
    margin: 0 0 6px 0;
    font-weight: 700;
    letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
    color: ${props => props.theme.text.secondary};
    font-size: 0.9375rem;
    margin: 0;
    max-width: 680px;
    line-height: 1.5;
`;

const GridContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 24px;
    align-items: start;

    @media (max-width: 960px) {
        grid-template-columns: 1fr;
    }
`;

// ─── Main Form Card ─────────────────────────────────────────────────────────
const MainCard = styled.div`
    background: ${props => props.theme.bg.card};
    border-radius: 16px;
    border: 1px solid ${props => props.theme.border};
    box-shadow: ${props => props.theme.shadow.sm};
    overflow: hidden;
    transition: background-color 0.2s, border-color 0.2s;
`;

const CardHeader = styled.div`
    padding: 20px 24px;
    border-bottom: 1px solid ${props => props.theme.border};
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const CardTitleSection = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const CardIconBox = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: ${props => props.theme.mode === 'dark' ? 'rgba(30, 64, 175, 0.2)' : '#EFF6FF'};
    color: ${props => props.theme.mode === 'dark' ? '#60A5FA' : '#1E40AF'};
    display: flex;
    align-items: center;
    justify-content: center;
`;

const CardTitle = styled.h2`
    font-size: 1.05rem;
    font-weight: 700;
    color: ${props => props.theme.text.primary};
    margin: 0;
`;

const CardSub = styled.p`
    font-size: 0.8125rem;
    color: ${props => props.theme.text.tertiary};
    margin: 2px 0 0 0;
`;

const FormBody = styled.div`
    padding: 24px;
`;

const FormGroup = styled.div`
    margin-bottom: 20px;
`;

const LabelRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
`;

const Label = styled.label`
    display: block;
    font-weight: 600;
    font-size: 0.875rem;
    color: ${props => props.theme.text.primary};
`;

const CreateNewLink = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    color: ${props => props.theme.mode === 'dark' ? '#60A5FA' : '#1E40AF'};
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0;

    &:hover {
        text-decoration: underline;
    }
`;

const Select = styled.select`
    width: 100%;
    padding: 12px 14px;
    border: 1px solid ${props => props.theme.border};
    border-radius: 10px;
    background: ${props => props.theme.mode === 'dark' ? '#131B2A' : '#ffffff'};
    color: ${props => props.theme.text.primary};
    font-size: 0.875rem;
    outline: none;
    transition: all 0.2s ease;

    &:focus {
        border-color: ${props => props.theme.borderFocus};
        box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.15);
    }
`;

const TemplateChipsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

const TemplateChip = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: ${props => props.theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC'};
    border: 1px solid ${props => props.theme.border};
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;

    .icon {
        font-size: 1rem;
    }

    .label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: ${props => props.theme.text.primary};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &:hover {
        background: ${props => props.theme.mode === 'dark' ? 'rgba(30, 64, 175, 0.2)' : '#EFF6FF'};
        border-color: ${props => props.theme.mode === 'dark' ? '#1E40AF' : '#BFDBFE'};
        transform: translateY(-1px);
    }
`;

const TextArea = styled.textarea`
    width: 100%;
    padding: 12px 14px;
    border: 1px solid ${props => props.theme.border};
    border-radius: 10px;
    background: ${props => props.theme.mode === 'dark' ? '#131B2A' : '#ffffff'};
    color: ${props => props.theme.text.primary};
    font-size: 0.875rem;
    line-height: 1.55;
    outline: none;
    resize: vertical;
    box-sizing: border-box;
    transition: all 0.2s ease;

    &:focus {
        border-color: ${props => props.theme.borderFocus};
        box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.15);
    }
`;

const HelperText = styled.p`
    font-size: 0.78rem;
    color: ${props => props.theme.text.tertiary};
    margin: 6px 0 0 0;
`;

const GenerateBtn = styled.button`
    width: 100%;
    padding: 14px 20px;
    background: ${props => props.theme.mode === 'dark' ? '#1E40AF' : '#111827'};
    color: #ffffff;
    border: none;
    border-radius: 9999px;
    font-weight: 600;
    font-size: 0.9375rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.2s ease;
    margin-top: 8px;

    &:hover:not(:disabled) {
        background: ${props => props.theme.mode === 'dark' ? '#2563EB' : '#1E40AF'};
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(30, 64, 175, 0.25);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .spin {
        animation: ${spin} 1s linear infinite;
    }
`;

// ─── Sidebar Card ────────────────────────────────────────────────────────────
const SidebarCard = styled.div`
    background: ${props => props.theme.bg.card};
    border-radius: 16px;
    border: 1px solid ${props => props.theme.border};
    padding: 24px;
    box-shadow: ${props => props.theme.shadow.sm};
`;

const SidebarTitle = styled.h3`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
    font-weight: 700;
    color: ${props => props.theme.text.primary};
    margin: 0 0 16px 0;
`;

const StepsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 20px;
`;

const StepItem = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 12px;
`;

const StepIndex = styled.div`
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${props => props.theme.mode === 'dark' ? 'rgba(30, 64, 175, 0.2)' : '#EFF6FF'};
    color: ${props => props.theme.mode === 'dark' ? '#60A5FA' : '#1E40AF'};
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
`;

const StepHeading = styled.h4`
    font-size: 0.85rem;
    font-weight: 600;
    color: ${props => props.theme.text.primary};
    margin: 0 0 2px 0;
`;

const StepSub = styled.p`
    font-size: 0.78rem;
    color: ${props => props.theme.text.secondary};
    margin: 0;
    line-height: 1.4;
`;

const TipsBox = styled.div`
    display: flex;
    gap: 10px;
    padding: 12px 14px;
    background: ${props => props.theme.mode === 'dark' ? 'rgba(30, 64, 175, 0.15)' : '#EFF6FF'};
    border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(30, 64, 175, 0.3)' : '#BFDBFE'};
    border-radius: 10px;
    color: ${props => props.theme.mode === 'dark' ? '#93C5FD' : '#1E40AF'};
    font-size: 0.78rem;
    line-height: 1.45;

    strong {
        display: block;
        font-weight: 600;
        margin-bottom: 2px;
    }

    p {
        margin: 0;
        color: ${props => props.theme.text.secondary};
    }
`;

// ─── Results View ────────────────────────────────────────────────────────────
const ResultCard = styled.div`
    background: ${props => props.theme.bg.card};
    border: 1px solid ${props => props.theme.mode === 'dark' ? '#1E3A8A' : '#BFDBFE'};
    border-radius: 16px;
    padding: 28px;
    margin-top: 28px;
    box-shadow: ${props => props.theme.shadow.md};
    animation: ${fadeIn} 0.3s ease-out;
`;

const ResultHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
`;

const ResultTitle = styled.h3`
    font-size: 1.2rem;
    font-weight: 700;
    color: ${props => props.theme.text.primary};
    margin: 0 0 2px 0;
`;

const ResultSub = styled.p`
    font-size: 0.85rem;
    color: ${props => props.theme.text.secondary};
    margin: 0;
`;

const SummaryCallout = styled.div`
    padding: 14px 18px;
    background: ${props => props.theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC'};
    border-left: 3px solid #1E40AF;
    border-radius: 0 8px 8px 0;
    font-size: 0.875rem;
    color: ${props => props.theme.text.secondary};
    font-style: italic;
    margin-bottom: 20px;
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;
`;

const ResultStat = styled.div`
    background: ${props => props.theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.45)' : '#EFF6FF'};
    padding: 18px 20px;
    border-radius: 12px;
    border: 1px solid ${props => props.theme.mode === 'dark' ? '#1E293B' : '#DBEAFE'};
    display: flex;
    align-items: center;
    gap: 16px;

    .icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: ${props => props.theme.mode === 'dark' ? 'rgba(30, 64, 175, 0.25)' : '#ffffff'};
        color: #1E40AF;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .label {
        font-size: 0.75rem;
        color: ${props => props.theme.text.tertiary};
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.04em;
    }

    .value {
        font-size: 1.6rem;
        font-weight: 800;
        color: ${props => props.theme.text.primary};
        margin-top: 2px;
    }
`;

const ModuleListContainer = styled.div`
    margin-bottom: 24px;
`;

const ModuleListTitle = styled.h4`
    font-size: 0.95rem;
    font-weight: 700;
    color: ${props => props.theme.text.primary};
    margin: 0 0 14px 0;
`;

const ModuleItem = styled.div`
    border: 1px solid ${props => props.theme.border};
    background: ${props => props.theme.mode === 'dark' ? '#131B2A' : '#ffffff'};
    border-radius: 12px;
    margin-bottom: 12px;
    overflow: hidden;
`;

const ModuleHeader = styled.div`
    padding: 12px 16px;
    background: ${props => props.theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#F8FAFC'};
    border-bottom: 1px solid ${props => props.theme.border};
    font-weight: 600;
    font-size: 0.875rem;
    color: ${props => props.theme.text.primary};
    display: flex;
    align-items: center;
    gap: 10px;
`;

const ModuleBadge = styled.span`
    margin-left: auto;
    font-size: 0.72rem;
    padding: 2px 8px;
    background: ${props => props.theme.mode === 'dark' ? 'rgba(30, 64, 175, 0.25)' : '#EFF6FF'};
    color: #1E40AF;
    border-radius: 9999px;
    font-weight: 600;
`;

const TaskList = styled.div`
    padding: 0;
`;

const TaskItem = styled.div`
    padding: 11px 16px;
    border-bottom: 1px solid ${props => props.theme.border};
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.84rem;
    color: ${props => props.theme.text.primary};

    &:last-child {
        border-bottom: none;
    }

    .task-title {
        flex: 1;
        font-weight: 500;
    }

    .priority {
        font-size: 0.7rem;
        padding: 2px 8px;
        border-radius: 9999px;
        font-weight: 600;
        text-transform: capitalize;

        &.high, &.urgent {
            background: rgba(239, 68, 68, 0.12);
            color: #EF4444;
        }
        &.medium {
            background: rgba(245, 158, 11, 0.12);
            color: #F59E0B;
        }
        &.low {
            background: rgba(16, 185, 129, 0.12);
            color: #10B981;
        }
    }

    .hours {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.75rem;
        color: ${props => props.theme.text.tertiary};
        font-weight: 500;
    }
`;

const ViewProjectBtn = styled.button`
    width: 100%;
    padding: 14px 20px;
    background: ${props => props.theme.mode === 'dark' ? '#1E40AF' : '#111827'};
    color: #ffffff;
    border: none;
    border-radius: 9999px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;

    &:hover {
        background: ${props => props.theme.mode === 'dark' ? '#2563EB' : '#1E40AF'};
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(30, 64, 175, 0.25);
    }
`;
