import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Sparkles, Loader2, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const PageContainer = styled.div`
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
`;

const Header = styled.div`
    margin-bottom: 2rem;
    text-align: center;
`;

const Title = styled.h1`
    font-size: 2rem;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
`;

const Subtitle = styled.p`
    color: var(--text-secondary);
    font-size: 1.1rem;
`;

const Card = styled.div`
    background: var(--bg-surface);
    border-radius: 0;
    padding: 2rem;
    border: 1px solid var(--border-color);
`;

const FormGroup = styled.div`
    margin-bottom: 1.5rem;
`;

const Label = styled.label`
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-primary);
`;

const Select = styled.select`
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0;
    background: var(--bg-surface);
    color: var(--text-primary);
    font-size: 1rem;
    transition: border-color 0.2s;
    border-bottom: 1px solid var(--border-color);

    &:focus {
        outline: 2px solid #0f62fe; /* Carbon focus */
        outline-offset: -2px;
        border-color: #0f62fe;
    }
`;

const TextArea = styled.textarea`
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 0;
    background: var(--bg-surface);
    color: var(--text-primary);
    font-size: 1rem;
    min-height: 150px;
    resize: vertical;
    transition: border-color 0.2s;
    border-bottom: 1px solid var(--border-color);

    &:focus {
        outline: 2px solid #0f62fe;
        outline-offset: -2px;
        border-color: #0f62fe;
    }
`;

const GenerateBtn = styled.button`
    width: 100%;
    padding: 1rem;
    background: #0f62fe; /* Carbon Blue */
    color: white;
    border: none;
    border-radius: 0;
    font-weight: 500;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: background 0.2s;

    &:hover:not(:disabled) {
        background: #0043ce;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const HelperText = styled.p`
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
`;

const ResultCard = styled.div`
    background: var(--bg-surface);
    border: 1px solid #24a148; /* Carbon Green */
    border-radius: 0;
    padding: 1.5rem;
    margin-top: 2rem;
    color: var(--text-primary);
    position: relative;

    &::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 4px;
        background: #24a148;
    }
`;

const ResultTitle = styled.h3`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #24a148; /* Carbon Green */
    margin-bottom: 1rem;
`;

const ResultStat = styled.div`
    background: var(--bg-surface);
    padding: 1rem;
    border-radius: 0;
    text-align: center;
    border: 1px solid var(--border-color);
    flex: 1;

    .label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-top: 0.25rem;
    }
`;

const StatsGrid = styled.div`
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
`;

const ModuleListContainer = styled.div`
    margin-bottom: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const ModuleItem = styled.div`
    border: 1px solid var(--border-color);
    background: var(--bg-surface);
    border-radius: 0;
`;

const ModuleHeader = styled.div`
    padding: 1rem;
    background: rgba(15, 98, 254, 0.05); /* very light Carbon Blue */
    border-bottom: 1px solid var(--border-color);
    font-weight: 600;
    color: var(--text-primary);
`;

const TaskList = styled.div`
    padding: 0;
`;

const TaskItem = styled.div`
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9rem;
    color: var(--text-secondary);

    &:last-child {
        border-bottom: none;
    }

    .priority {
        font-size: 0.75rem;
        padding: 0.1rem 0.4rem;
        background: var(--bg-hover);
        text-transform: capitalize;
        border: 1px solid var(--border-color);
    }
    
    .hours {
        margin-left: auto;
        font-size: 0.8rem;
        color: var(--text-tertiary);
    }
`;

const ViewProjectBtn = styled.button`
    width: 100%;
    padding: 0.75rem;
    background: transparent;
    border: 1px solid #0f62fe; /* Carbon Blue */
    color: #0f62fe;
    border-radius: 0;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: background 0.2s, color 0.2s;

    &:hover {
        background: #0f62fe;
        color: white;
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
            // Re-using the sprint planner endpoint logic to get active projects
            const response = await api.get('/projects');
            setProjects(response.data.data);
            if (response.data.data.length > 0) {
                // Select the first one by default if it's new/empty (naive assumption here)
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
                setDescription(''); // clear description
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
                <Title>
                    <Sparkles size={28} color="#0f62fe" />
                    AI Project Scaffolder
                </Title>
                <Subtitle>Describe your project in plain text, and AI will automatically build the modules and tasks.</Subtitle>
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
                    <HelperText>Choose an empty or new project to avoid confusing existing tasks with new ones.</HelperText>
                </FormGroup>

                <FormGroup>
                    <Label htmlFor="description">Project Description & Requirements</Label>
                    <TextArea
                        id="description"
                        placeholder="e.g., Build a mobile app for a food delivery service with user auth, menus, cart, and payments."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isGenerating}
                    />
                    <HelperText>Be as descriptive as you like. The AI supports defining roles, features, and specific milestones.</HelperText>
                </FormGroup>

                <GenerateBtn onClick={handleGenerate} disabled={isGenerating || !selectedProject || !description.trim()}>
                    {isGenerating ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Generating Architecture... This may take a minute.
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            Generate & Build Project
                        </>
                    )}
                </GenerateBtn>
            </Card>

            {result && (
                <ResultCard>
                    <ResultTitle>
                        <CheckCircle size={24} />
                        Scaffolding Complete!
                    </ResultTitle>
                    <p style={{ marginBottom: '1.5rem', fontStyle: 'italic' }}>
                        "{result.summary}"
                    </p>

                    <StatsGrid>
                        <ResultStat>
                            <div className="label">Modules Created</div>
                            <div className="value">{result.stats.modulesCreated}</div>
                        </ResultStat>
                        <ResultStat>
                            <div className="label">Tasks Created</div>
                            <div className="value">{result.stats.tasksCreated}</div>
                        </ResultStat>
                    </StatsGrid>

                    {result.modules && result.modules.length > 0 && (
                        <ModuleListContainer>
                            <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Generated Structure</h4>
                            {result.modules.map((mod, idx) => (
                                <ModuleItem key={idx}>
                                    <ModuleHeader>{mod.name}</ModuleHeader>
                                    <TaskList>
                                        {mod.tasks?.map((t, tIdx) => (
                                            <TaskItem key={tIdx}>
                                                <CheckCircle size={14} color="var(--text-tertiary)" />
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
                        <ArrowRight size={18} />
                    </ViewProjectBtn>
                </ResultCard>
            )}
        </PageContainer>
    );
};

export default ProjectScaffolderPage;
