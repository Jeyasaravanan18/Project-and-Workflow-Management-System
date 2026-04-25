import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { UserPlus, Users, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import TeamMemberCard from './TeamMemberCard';
import AddMemberModal from './AddMemberModal';
import LoadingSkeleton from './LoadingSkeleton';

const ProjectTeamTab = ({ projectId }) => {
    const [teamData, setTeamData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        fetchTeamMembers();
    }, [projectId]);

    const fetchTeamMembers = async () => {
        try {
            const res = await api.get(`/projects/${projectId}/members`);
            setTeamData(res.data);
        } catch (error) {
            console.error('Error fetching team members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            await api.delete(`/projects/${projectId}/members/${userId}`);
            fetchTeamMembers();
        } catch (error) {
            console.error('Error removing member:', error);
            alert(error.response?.data?.message || 'Failed to remove member');
        }
    };

    if (loading) {
        return (
            <Grid>
                <LoadingSkeleton type="card" count={4} />
            </Grid>
        );
    }

    if (!teamData) {
        return (
            <EmptyStateContainer>
                <div className="icon">
                    <ShieldAlert size={48} />
                </div>
                <h3>Failed to load team</h3>
                <p>Please try refreshing the page.</p>
            </EmptyStateContainer>
        );
    }

    const allMembers = teamData.members || [];
    const totalMembers = allMembers.length + (teamData.manager ? 1 : 0);

    return (
        <Container>
            <Header>
                <HeaderContent>
                    <IconWrapper>
                        <Users size={24} />
                    </IconWrapper>
                    <div>
                        <Title>Team Members</Title>
                        <Subtitle>{totalMembers} member{totalMembers !== 1 ? 's' : ''} working on this project</Subtitle>
                    </div>
                </HeaderContent>

                <AddButton onClick={() => setIsAddModalOpen(true)}>
                    <UserPlus size={18} />
                    Add Member
                </AddButton>
            </Header>

            <Grid>
                {/* Project Manager */}
                {teamData.manager && (
                    <TeamMemberCard
                        member={teamData.manager}
                        isManager={true}
                    />
                )}

                {/* Team Members */}
                {allMembers.map(member => (
                    <TeamMemberCard
                        key={member._id}
                        member={member}
                        onRemove={handleRemoveMember}
                    />
                ))}
            </Grid>

            {/* Empty State for Members only (if manager exists but no members) */}
            {allMembers.length === 0 && (
                <EmptyTeamState>
                    <Users size={48} className="icon" />
                    <p>No team members yet</p>
                    <span>Click "Add Member" to assign people to this project</span>
                </EmptyTeamState>
            )}

            <AddMemberModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                projectId={projectId}
                onSuccess={fetchTeamMembers}
            />
        </Container>
    );
};

// Animations
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const Container = styled.div`
    padding-bottom: 40px;
    animation: ${fadeIn} 0.4s ease-out;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
`;

const HeaderContent = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
`;

const IconWrapper = styled.div`
    width: 48px;
    height: 48px;
    background: transparent;
    border: 1px solid #0f62fe;
    border-radius: 0; /* Carbon */
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0f62fe;
`;

const Title = styled.h2`
    font-size: 1.5rem;
    font-weight: 300; /* Carbon */
    color: ${p => p.theme.text.primary};
    line-height: 1.2;
    margin-bottom: 4px;
`;

const Subtitle = styled.p`
    font-size: 0.875rem;
    color: #64748b;
`;

const AddButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: #0f62fe; /* Carbon Blue */
    color: white;
    border: none;
    border-radius: 0; /* Carbon */
    font-size: 0.875rem;
    font-weight: 400;
    cursor: pointer;
    box-shadow: none;
    transition: all 0.2s ease;

    &:hover {
        background: #0043ce;
    }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
`;

const EmptyStateContainer = styled.div`
    padding: 60px;
    text-align: center;
    color: ${p => p.theme.text.secondary};
    background: ${p => p.theme.bg.card};
    border-radius: 0; /* Carbon */
    border: 1px dashed ${p => p.theme.border};

    .icon {
        color: #da1e28;
        margin-bottom: 16px;
    }
`;

const EmptyTeamState = styled.div`
    grid-column: 1 / -1;
    padding: 48px;
    text-align: center;
    background: ${p => p.theme.bg.card};
    border-radius: 0; /* Carbon */
    border: 1px dashed ${p => p.theme.border};
    margin-top: 16px;

    .icon {
        color: #cbd5e1;
        margin-bottom: 16px;
        opacity: 0.5;
    }

    p {
        font-size: 1rem;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 4px;
    }

    span {
        font-size: 0.875rem;
        color: #64748b;
    }
`;

export default ProjectTeamTab;
