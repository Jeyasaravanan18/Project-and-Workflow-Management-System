import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Sparkles, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const PageContainer = styled.div`
    padding: 32px 24px;
    max-width: 860px;
    margin: 0 auto;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Header = styled.div`
    margin-bottom: 28px;
    text-align: center;
`;

const Badge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #ecfdf5;
    color: #008060;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid #a7f3d0;
    margin-bottom: 12px;
`;

const Title = styled.h1`
    font-size: 1.875rem;
    color: #111827;
    margin: 0 0 8px 0;
    font-weight: 700;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
`;

const Subtitle = styled.p`
    color: #64748b;
    font-size: 0.9375rem;
    margin: 0;
`;

const Card = styled.div`
    background: #ffffff;
    border-radius: 14px;
    padding: 28px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
`;

const FormGroup = styled.div`
    margin-bottom: 20px;
`;

const Label = styled.label`
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    color: #1f2937;
`;

const Select = styled.select`
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #ffffff;
    color: #111827;
    font-size: 0.875rem;
    transition: all 0.15s ease;

    &:focus {
        outline: none;
        border-color: #008060;
        box-shadow: 0 0 0 3px rgba(0, 128, 96, 0.12);
    }

    &:disabled {
        background: #f8fafc;
        cursor: not-allowed;
    }
`;

const TextArea = styled.textarea`
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #ffffff;
    color: #111827;
    font-size: 0.875rem;
    min-height: 140px;
    resize: vertical;
    line-height: 1.5;
    transition: all 0.15s ease;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: #008060;
        box-shadow: 0 0 0 3px rgba(0, 128, 96, 0.12);
    }

    &:disabled {
        background: #f8fafc;
        cursor: not-allowed;
    }
`;

const GenerateBtn = styled.button`
    width: 100%;
    padding: 12px 20px;
    background: #111827;
    color: #ffffff;
    border: none;
    border-radius: 9999px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.15s ease;
    margin-top: 10px;

    &:hover:not(:disabled) {
        background: #008060;
    }

    &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
`;

const HelperText = styled.p`
    font-size: 0.78rem;
    color: #64748b;
    margin-top: 6px;
    margin-bottom: 0;
`;

const ResultCard = styled.div`
    background: #ffffff;
    border: 1px solid #a7f3d0;
    border-radius: 14px;
    padding: 24px;
    margin-top: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
`;

const ResultTitle = styled.h3`
    display: flex;
    align-items: center;
    gap: 8px;
    color: #008060;
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 12px 0;
`;

const ResultStat = styled.div`
    background: #ecfdf5;
    padding: 14px 18px;
    border-radius: 10px;
    text-align: center;
    border: 1px solid #d1fae5;
    flex: 1;

    .label {
        font-size: 0.75rem;
        color: #065f46;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: 600;
    }

    .value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #008060;
        margin-top: 2px;
    }
`;

const StatsGrid = styled.div`
    display: flex;
    gap: 14px;
    margin-bottom: 20px;
`;

const ModuleListContainer = styled.div`
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const ModuleItem = styled.div`
    border: 1px solid #e5e7eb;
    background: #ffffff;
    border-radius: 10px;
    overflow: hidden;
`;

const ModuleHeader = styled.div`
    padding: 10px 14px;
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
    font-weight: 600;
    font-size: 0.875rem;
    color: #1f2937;
`;

const TaskList = styled.div`
    padding: 0;
`;

const TaskItem = styled.div`
    padding: 10px 14px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.84rem;
    color: #374151;

    &:last-child {
        border-bottom: none;
    }

    .priority {
        font-size: 0.7rem;
        padding: 2px 8px;
        background: #f1f5f9;
        text-transform: capitalize;
        border-radius: 9999px;
        font-weight: 500;
        color: #475569;
    }
    
    .hours {
        margin-left: auto;
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 500;
    }
`;

const ViewProjectBtn = styled.button`
    width: 100%;
    padding: 12px 20px;
    background: #111827;
    color: #ffffff;
    border: none;
    border-radius: 9999px;
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.15s ease;

    &:hover {
        background: #008060;
    }
`;

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
            setProjects(response.data.data);
            if (response.data.data.length > 0) {
                setSelectedProject(response.data.data[0]._id);
            }
        } catch (error) {
            toast.error('Failed to fetch projects');
            console.error(error);
        }
    };

    const handleGenerate = async () => {
        if (!selectedProject) {
            toast.error('Please select a project');
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
                setDescription('');
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to scaffold project';
            toast.error(msg);
            console.error('Scaffold error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <PageContainer>
            <Header>
                <Badge><Sparkles size={12} /> AI Project Architect</Badge>
                <Title>
                    AI Project Scaffolder
                </Title>
                <Subtitle>Describe your requirements in plain text and let AI organize modules and tasks automatically.</Subtitle>
            </Header>

            <Card>
                <FormGroup>
                    <Label htmlFor="projectSelect">Target Project</Label>
                    <Select
                        id="projectSelect"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        disabled={isGenerating}
                    >
                        <option value="">-- Select a Project --</option>
                        {projects.map((p) => (
                            <option key={p._id} value={p._id}>
                                {p.name}
                            </option>
                        ))}
                    </Select>
                    <HelperText>Select an existing or new project to populate with structure.</HelperText>
                </FormGroup>

                <FormGroup>
                    <Label htmlFor="description">Project Description & Requirements</Label>
                    <TextArea
                        id="description"
                        placeholder="e.g., Build a customer onboarding mobile application with authentication, multi-step profile setup, document verification, and welcome tours."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isGenerating}
                    />
                    <HelperText>Include key user roles, primary modules, and milestone requirements for best results.</HelperText>
                </FormGroup>

                <GenerateBtn onClick={handleGenerate} disabled={isGenerating || !selectedProject || !description.trim()}>
                    {isGenerating ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Generating Architecture... Please wait.
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} />
                            Generate & Build Structure
                        </>
                    )}
                </GenerateBtn>
            </Card>

            {result && (
                <ResultCard>
                    <ResultTitle>
                        <CheckCircle size={20} />
                        Scaffolding Complete!
                    </ResultTitle>
                    <p style={{ marginBottom: '16px', color: '#4b5563', fontSize: '0.875rem', fontStyle: 'italic' }}>
                        "{result.summary}"
                    </p>

                    <StatsGrid>
                        <ResultStat>
                            <div className="label">Modules Created</div>
                            <div className="value">{result.stats?.modulesCreated || 0}</div>
                        </ResultStat>
                        <ResultStat>
                            <div className="label">Tasks Created</div>
                            <div className="value">{result.stats?.tasksCreated || 0}</div>
                        </ResultStat>
                    </StatsGrid>

                    {result.modules && result.modules.length > 0 && (
                        <ModuleListContainer>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>Generated Modules</h4>
                            {result.modules.map((mod, idx) => (
                                <ModuleItem key={idx}>
                                    <ModuleHeader>{mod.name}</ModuleHeader>
                                    <TaskList>
                                        {mod.tasks?.map((t, tIdx) => (
                                            <TaskItem key={tIdx}>
                                                <CheckCircle size={14} color="#008060" />
                                                <span>{t.title}</span>
                                                <span className="priority">{t.priority}</span>
                                                <span className="hours">{t.estimatedHours}h</span>
                                            </TaskItem>
                                        ))}
                                    </TaskList>
                                </ModuleItem>
                            ))}
                        </ModuleListContainer>
                    )}

                    <ViewProjectBtn onClick={() => navigate(`/projects/${selectedProject}`)}>
                        Go to Project Dashboard
                        <ArrowRight size={16} />
                    </ViewProjectBtn>
                </ResultCard>
            )}
        </PageContainer>
    );
};

export default ProjectScaffolderPage;
