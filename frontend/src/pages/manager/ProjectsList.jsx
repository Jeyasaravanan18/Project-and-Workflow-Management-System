import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';
import CreateProjectForm from '../../components/forms/CreateProjectForm';
import { Plus, ArrowUpRight, Clock, MoreVertical, Search, Zap, LayoutGrid, List as ListIcon } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import styled, { keyframes, css } from 'styled-components';
import useRecentlyViewed from '../../hooks/useRecentlyViewed';

// Helper to generate consistent solid colors based on string
const getProjectColor = (str) => {
    const colors = [
        '#fa4d56', // Red 50
        '#0f62fe', // Blue 60
        '#198038', // Green 60
        '#8a3ffc', // Purple 60
        '#d12771', // Magenta 60
        '#0072c3', // Cyan 60
        '#111b1c', // Teal 100
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const ProjectsList = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const hasFetchedRef = useRef(false);
    const { trackVisit } = useRecentlyViewed();

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            const projectsData = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
            setProjects(projectsData);
        } catch (error) {
            console.error(error);
            setProjects([]);
        } finally {
            setTimeout(() => setLoading(false), 600);
        }
    };

    useEffect(() => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;
        fetchProjects();
        trackVisit({ id: 'projects', label: 'All Projects', path: '/projects', type: 'page' });
    }, []);

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchesFilter = filter === 'all' || p.status === filter;
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [projects, filter, searchQuery]);

    const stats = useMemo(() => {
        const total = projects.length;
        const active = projects.filter(p => p.status === 'active').length;
        const completed = projects.filter(p => p.status === 'completed').length;
        const delayed = projects.filter(p => {
            if (!p.targetEndDate) return false;
            return new Date(p.targetEndDate) < new Date() && p.status !== 'completed';
        }).length;
        return { total, active, completed, delayed };
    }, [projects]);

    const getDaysRemaining = (date) => {
        if (!date) return null;
        const days = differenceInDays(new Date(date), new Date());
        if (days < 0) return { text: `${Math.abs(days)}d Overdue`, color: '#EF4444', bg: '#FEF2F2' };
        if (days === 0) return { text: 'Due Today', color: '#F97316', bg: '#FFF7ED' };
        return { text: `${days}d Left`, color: '#64748B', bg: '#F8FAFC' };
    };

    if (loading) {
        return (
            <PageContainer>
                <LoaderContainer>
                    <div className="spinner" />
                    <p>Curating your workspace...</p>
                </LoaderContainer>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Project"
            >
                <CreateProjectForm
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        fetchProjects();
                    }}
                    onCancel={() => setIsCreateModalOpen(false)}
                />
            </Modal>

            {/* Modern Hero Header */}
            <HeaderSection>
                <HeaderContent>
                    <WelcomeText>
                        Dashboard <span style={{ color: '#cbd5e1' }}>/</span> Projects
                    </WelcomeText>
                    <MainTitle>
                        Every great
                        <span className="highlight"> idea </span>
                        starts here.
                    </MainTitle>
                    <StatsRow>
                        <StatBadge $active>
                            <span className="dot" />
                            {stats.active} Active
                        </StatBadge>
                        <StatBadge>
                            {stats.completed} Completed
                        </StatBadge>
                        {stats.delayed > 0 && (
                            <StatBadge $type="danger">
                                {stats.delayed} Delayed
                            </StatBadge>
                        )}
                    </StatsRow>
                </HeaderContent>

                <ActionGroup>
                    <SearchWrapper>
                        <Search size={18} />
                        <input
                            placeholder="Find a project..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </SearchWrapper>
                    <CreateButton onClick={() => setIsCreateModalOpen(true)} data-tour="create-project-btn">
                        <Plus size={20} />
                        <span>New Project</span>
                    </CreateButton>
                </ActionGroup>
            </HeaderSection>

            {/* Filter & View Controls */}
            <ControlsBar>
                <FilterGroup>
                    {['all', 'active', 'planning', 'completed'].map(f => (
                        <FilterTab
                            key={f}
                            $isActive={filter === f}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </FilterTab>
                    ))}
                </FilterGroup>

                <ViewSwitch>
                    <ViewBtn $active={viewMode === 'grid'} onClick={() => setViewMode('grid')}>
                        <LayoutGrid size={18} />
                    </ViewBtn>
                    <ViewBtn $active={viewMode === 'list'} onClick={() => setViewMode('list')}>
                        <ListIcon size={18} />
                    </ViewBtn>
                </ViewSwitch>
            </ControlsBar>

            {/* The Modern Grid */}
            <ProjectGrid $mode={viewMode}>
                {filteredProjects.map((project, index) => {
                    const projectColor = getProjectColor(project._id + project.name);
                    const due = getDaysRemaining(project.targetEndDate);
                    const progress = project.progress !== undefined ? project.progress : 0;

                    if (viewMode === 'list') {
                        return (
                            <ListItem key={project._id} to={`/projects/${project._id}`} $delay={index}>
                                <div className="color-strip" style={{ background: projectColor }} />
                                <div className="info">
                                    <h3>{project.name}</h3>
                                    <p>{project.managerId?.name || 'Unassigned'}</p>
                                </div>
                                <div className="status">
                                    <span className={`badge ${project.status}`}>{project.status}</span>
                                </div>
                                <div className="progress">
                                    <div className="bar"><div className="fill" style={{ width: `${progress}%` }} /></div>
                                    <span>{progress}%</span>
                                </div>
                                <div className="date">
                                    {due ? due.text : '-'}
                                </div>
                                <ArrowUpRight size={18} className="arrow" />
                            </ListItem>
                        );
                    }

                    return (
                        <GalleryCard key={project._id} to={`/projects/${project._id}`} $delay={index}>
                            <CardCover style={{ background: projectColor }}>
                                <OverlayTags>
                                    <Tag className="glass">{project.status}</Tag>
                                    {due && (
                                        <Tag className="glass-light">
                                            <Clock size={10} /> {due.text}
                                        </Tag>
                                    )}
                                </OverlayTags>
                                <ProjectInitial>
                                    {project.name.charAt(0)}
                                </ProjectInitial>
                            </CardCover>

                            <CardBody>
                                <div className="top-row">
                                    <CardTitle>{project.name}</CardTitle>
                                    <MenuButton onClick={e => e.preventDefault()}>
                                        <MoreVertical size={16} />
                                    </MenuButton>
                                </div>

                                <CardMeta>
                                    <div className="manager">
                                        <div className="avatar">
                                            {project.managerId?.name?.charAt(0) || 'U'}
                                        </div>
                                        <span>{project.managerId?.name?.split(' ')[0] || 'Unassigned'}</span>
                                    </div>
                                    <div className="stats">
                                        <Zap size={12} fill="currentColor" />
                                        <span>{project.taskStats?.total || 0} Tasks</span>
                                    </div>
                                </CardMeta>

                                <ProgressContainer>
                                    <div className="label">
                                        <span>Completion</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="track">
                                        <div className="fill" style={{ width: `${progress}%`, background: projectColor }} />
                                    </div>
                                </ProgressContainer>
                            </CardBody>

                            <HoverOverlay>
                                <span>Open Project</span>
                                <ArrowUpRight size={18} />
                            </HoverOverlay>
                        </GalleryCard>
                    );
                })}
            </ProjectGrid>

            {filteredProjects.length === 0 && (
                <EmptyState>
                    <h2>No projects found</h2>
                    <p>Try clearing your filters or create a new masterpiece.</p>
                </EmptyState>
            )}
        </PageContainer>
    );
};

// --- Styles & Animations ---

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const PageContainer = styled.div`
    padding: 32px;
    max-width: 1600px;
    margin: 0 auto;
    min-height: 100vh;
    font-family: 'IBM Plex Sans', sans-serif;
    background: ${props => props.theme.bg.primary};
    transition: background-color 0.3s;
`;

const LoaderContainer = styled.div`
    height: 80vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
    .spinner {
        width: 32px;
        height: 32px;
        border: 2px solid ${props => props.theme.border};
        border-top-color: #0f62fe;
        border-radius: 50%;
        animation: ${spin} 1s linear infinite;
        margin-bottom: 20px;
    }
    
    p { color: ${props => props.theme.text.secondary}; font-weight: 500; }
`;

const HeaderSection = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 60px;
    animation: ${fadeIn} 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 30px;
    }
`;

const HeaderContent = styled.div`
    flex: 1;
`;

const WelcomeText = styled.div`
    font-size: 0.875rem;
    font-weight: 600;
    color: ${props => props.theme.text.tertiary};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
`;

const MainTitle = styled.h1`
    font-size: 2.5rem;
    font-weight: 400; /* Carbon uses lighter weights for large headers */
    color: ${props => props.theme.text.primary};
    line-height: 1.1;
    margin-bottom: 32px;
    letter-spacing: 0;

    .highlight {
        color: #0f62fe; /* Carbon Blue */
        display: inline;
    }
`;

const StatsRow = styled.div`
    display: flex;
    gap: 12px;
`;

const StatBadge = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    background: ${props => props.theme.bg.card};
    border: 1px solid ${props => props.theme.border};
    border-radius: 0; /* Carbon */
    font-size: 0.75rem;
    font-weight: 400;
    color: ${props => props.$type === 'danger' ? '#da1e28' : props.theme.text.secondary};
    box-shadow: none;

    ${props => props.$active && css`
        color: ${props.theme.text.primary};
        border-color: #0f62fe;
        
        .dot {
            width: 8px;
            height: 8px;
            background: #198038; /* Carbon Green */
            border-radius: 0; /* Brutalist dot */
        }
    `}
`;

const ActionGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
`;

const SearchWrapper = styled.div`
    position: relative;
    
    svg {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: ${props => props.theme.text.tertiary};
    }

    input {
        padding: 12px 16px 12px 44px;
        border-radius: 0;
        border: none;
        border-bottom: 1px solid ${props => props.theme.border};
        width: 240px;
        outline: none;
        font-size: 0.875rem;
        transition: all 0.2s ease;
        background: ${props => props.theme.bg.tertiary};
        color: ${props => props.theme.text.primary};

        &:focus {
            border-bottom: 2px solid #0f62fe;
            width: 280px;
        }

        &::placeholder {
            color: ${props => props.theme.text.tertiary};
        }
    }
`;

const CreateButton = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 24px;
    background: #0f62fe; /* Carbon Blue */
    color: white;
    font-weight: 400;
    font-size: 0.875rem;
    border: none;
    border-radius: 0; /* Carbon */
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: none;

    &:hover {
        background: #0043ce; /* Carbon Blue Hover */
    }
`;

const ControlsBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
`;

const FilterGroup = styled.div`
    display: flex;
    gap: 0;
    padding: 0;
    background: ${props => props.theme.bg.tertiary};
    border-radius: 0; /* Carbon */
    border: 1px solid ${props => props.theme.border};
`;

const FilterTab = styled.button`
    padding: 8px 16px;
    border-radius: 0; /* Carbon */
    border: none;
    background: ${props => props.$isActive ? props.theme.bg.card : 'transparent'};
    color: ${props => props.$isActive ? props.theme.text.primary : props.theme.text.secondary};
    font-weight: ${props => props.$isActive ? '600' : '400'};
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 2px solid ${props => props.$isActive ? '#0f62fe' : 'transparent'};

    &:hover {
        background: ${props => props.theme.bg.hover};
        color: ${props => props.theme.text.primary};
    }
`;

const ViewSwitch = styled.div`
    display: flex;
    gap: 0;
    background: ${props => props.theme.bg.card};
    padding: 0;
    border: 1px solid ${props => props.theme.border};
    border-radius: 0; /* Carbon */
`;

const ViewBtn = styled.button`
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: ${props => props.$active ? props.theme.bg.hover : 'transparent'};
    color: ${props => props.$active ? props.theme.text.primary : props.theme.text.tertiary};
    border-radius: 0; /* Carbon */
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 2px solid ${props => props.$active ? '#0f62fe' : 'transparent'};

    &:hover {
        background: ${props => props.theme.bg.hover};
        color: ${props => props.theme.text.primary};
    }
`;

const ProjectGrid = styled.div`
    display: grid;
    grid-template-columns: ${props => props.$mode === 'list' ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))'};
    gap: 24px;
    padding-bottom: 60px;
`;

// --- Gallery Card Styles ---
const GalleryCard = styled(Link)`
    position: relative;
    background: ${props => props.theme.bg.card};
    border-radius: 0; /* Carbon */
    overflow: hidden;
    text-decoration: none;
    transition: all 0.2s ease;
    border: 1px solid ${props => props.theme.border};
    box-shadow: none; /* Carbon */
    animation: ${fadeIn} 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
    animation-delay: ${props => props.$delay * 0.05}s;
    opacity: 0;
    animation-fill-mode: forwards;

    &:hover {
        border-color: #0f62fe; /* Carbon Blue */
        z-index: 2;
    }
`;

const CardCover = styled.div`
    height: 140px;
    position: relative;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
`;

const OverlayTags = styled.div`
    display: flex;
    gap: 8px;

    .glass {
        padding: 2px 8px;
        background: #161616; /* Carbon Gray 100 */
        color: #f4f4f4;
        border-radius: 0;
        font-size: 0.6875rem;
        font-weight: 400;
        text-transform: uppercase;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .glass-light {
        padding: 2px 8px;
        background: #f4f4f4; /* Carbon Gray 10 */
        color: #161616;
        border-radius: 0;
        font-size: 0.6875rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
        box-shadow: none;
        
        svg { color: #0f62fe; }
    }
`;

const Tag = styled.div`
    display: inline-flex;
`;

const ProjectInitial = styled.div`
    position: absolute;
    bottom: -24px;
    right: 24px;
    font-size: 8rem;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.15);
    line-height: 1;
    pointer-events: none;
`;

const CardBody = styled.div`
    padding: 24px;
`;

const CardTitle = styled.h3`
    font-size: 1.125rem;
    font-weight: 400; /* Carbon */
    color: ${props => props.theme.text.primary};
    margin: 0;
    flex: 1;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

const MenuButton = styled.button`
    background: transparent;
    border: none;
    color: ${props => props.theme.text.tertiary};
    cursor: pointer;
    padding: 4px;
    
    &:hover { color: ${props => props.theme.text.secondary}; }
`;

const CardMeta = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    margin-bottom: 24px;

    .manager {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: ${props => props.theme.bg.tertiary};
            color: ${props => props.theme.text.secondary};
            font-size: 0.75rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid ${props => props.theme.bg.card};
            box-shadow: 0 0 0 1px ${props => props.theme.border};
        }

        span {
            font-size: 0.8125rem;
            color: ${props => props.theme.text.secondary};
            font-weight: 500;
        }
    }

    .stats {
        display: flex;
        align-items: center;
        gap: 4px;
        color: ${props => props.theme.text.tertiary};
        font-size: 0.75rem;
        font-weight: 600;
    }
`;

const ProgressContainer = styled.div`
    .label {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        font-weight: 600;
        color: ${props => props.theme.text.secondary};
        margin-bottom: 6px;
    }

    .track {
        height: 4px;
        background: ${props => props.theme.bg.tertiary};
        border-radius: 0; /* Carbon */
        overflow: hidden;
    }

    .fill {
        height: 100%;
        border-radius: 0; /* Carbon */
    }
`;

const HoverOverlay = styled.div`
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    opacity: 0;
    transition: all 0.3s ease;
    color: white;
    font-weight: 700;
    font-size: 1.125rem;

    ${GalleryCard}:hover & {
        display: none; // Disabling for now as it conflicts with card click
    }
`;

// --- List Items ---
const ListItem = styled(Link)`
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: ${props => props.theme.bg.card};
    border-radius: 0; /* Carbon */
    border: 1px solid ${props => props.theme.border};
    text-decoration: none;
    gap: 20px;
    transition: all 0.2s;
    animation: ${fadeIn} 0.3s ease-out;
    animation-delay: ${props => props.$delay * 0.03}s;
    opacity: 0;
    animation-fill-mode: forwards;

    &:hover {
        background: ${props => props.theme.bg.hover};
        border-color: #0f62fe; /* Carbon Blue */

        .arrow { opacity: 1; transform: translate(0, 0); }
    }

    .color-strip {
        width: 4px;
        height: 32px;
        border-radius: 0;
    }

    .info {
        flex: 2;
        h3 { font-size: 1rem; color: ${props => props.theme.text.primary}; margin-bottom: 2px; }
        p { font-size: 0.8125rem; color: ${props => props.theme.text.secondary}; }
    }

    .status {
        width: 100px;
        .badge {
            padding: 2px 8px;
            border-radius: 0; /* Carbon */
            font-size: 0.6875rem;
            font-weight: 600;
            text-transform: uppercase;
            border: 1px solid transparent;
            
            &.active { 
                background: ${props => props.theme.mode === 'dark' ? 'rgba(25, 128, 56, 0.2)' : '#defbe6'}; 
                color: #198038; 
                border-color: #198038;
            }
            &.planning { 
                background: ${props => props.theme.mode === 'dark' ? 'rgba(15, 98, 254, 0.2)' : '#edf5ff'}; 
                color: #0f62fe; 
                border-color: #0f62fe;
            }
            &.completed { 
                background: ${props => props.theme.bg.tertiary}; 
                color: ${props => props.theme.text.secondary}; 
                border-color: ${props => props.theme.text.tertiary};
            }
        }
    }

    .progress {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
        span { font-size: 0.75rem; color: ${props => props.theme.text.secondary}; width: 32px; }
        .bar { flex: 1; height: 4px; background: ${props => props.theme.bg.tertiary}; border-radius: 0; overflow: hidden; }
        .fill { height: 100%; background: #0f62fe; border-radius: 0; }
    }

    .date {
        width: 100px;
        text-align: right;
        font-size: 0.75rem;
        font-weight: 600;
        color: ${props => props.theme.text.secondary};
    }

    .arrow {
        color: #0f62fe;
        opacity: 0;
        transform: translate(-10px, 10px);
        transition: all 0.2s ease;
    }
`;

const EmptyState = styled.div`
    grid-column: 1 / -1;
    padding: 64px;
    text-align: center;
    background: ${props => props.theme.bg.card};
    border-radius: 0; /* Carbon */
    border: 1px dashed ${props => props.theme.border};
    
    h2 { font-size: 1.5rem; color: ${props => props.theme.text.primary}; margin-bottom: 8px; }
    p { color: ${props => props.theme.text.secondary}; }
`;

export default ProjectsList;
