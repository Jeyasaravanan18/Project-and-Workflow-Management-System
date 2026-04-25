import styled, { keyframes } from 'styled-components';
import { Circle, X, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

const TeamMemberCard = ({ member, onRemove, isManager = false }) => {
    const [showConfirm, setShowConfirm] = useState(false);

    const getStatusColor = () => {
        if (member.onlineStatus === 'online') return '#24a148'; // Carbon Green 60
        if (member.onlineStatus === 'away') return '#f1c21b';   // Carbon Yellow 30
        return '#8d8d8d'; // Carbon Gray 50
    };

    const handleRemove = () => {
        onRemove(member._id);
        setShowConfirm(false);
    };

    return (
        <Card>
            {/* Remove Button (if not manager) */}
            {!isManager && !showConfirm && (
                <RemoveButton onClick={() => setShowConfirm(true)}>
                    <X size={14} />
                </RemoveButton>
            )}

            {/* Confirmation Overlay */}
            {showConfirm && (
                <ConfirmOverlay>
                    <ConfirmText>Remove {member.name}?</ConfirmText>
                    <ConfirmActions>
                        <CancelBtn onClick={() => setShowConfirm(false)}>Cancel</CancelBtn>
                        <DeleteBtn onClick={handleRemove}>Remove</DeleteBtn>
                    </ConfirmActions>
                </ConfirmOverlay>
            )}

            <Header>
                <AvatarWrapper>
                    <Avatar>
                        {member.name?.charAt(0) || 'U'}
                    </Avatar>
                    <StatusDot color={getStatusColor()} />
                </AvatarWrapper>

                <Info>
                    <NameRow>
                        <Name>{member.name}</Name>
                        {isManager && <ManagerBadge>Manager</ManagerBadge>}
                    </NameRow>
                    <Email title={member.email}>{member.email}</Email>
                </Info>
            </Header>

            <RoleSection>
                <RoleBadge>{member.role}</RoleBadge>
            </RoleSection>

            {(member.tasksAssigned !== undefined || member.tasksCompleted !== undefined) && (
                <StatsRow>
                    <Stat>
                        <StatValue>{member.tasksAssigned || 0}</StatValue>
                        <StatLabel>Assigned</StatLabel>
                    </Stat>
                    <Divider />
                    <Stat>
                        <StatValue $color="#22c55e">{member.tasksCompleted || 0}</StatValue>
                        <StatLabel>Completed</StatLabel>
                    </Stat>
                </StatsRow>
            )}

            <Footer>
                {member.onlineStatus === 'online' ? (
                    <ActiveText $active>Active now</ActiveText>
                ) : (
                    <ActiveText>
                        {member.lastActive
                            ? `Last active ${formatDistanceToNow(new Date(member.lastActive), { addSuffix: true })}`
                            : 'Offline'}
                    </ActiveText>
                )}
            </Footer>
        </Card>
    );
};

// Animations
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const Card = styled.div`
    background: ${props => props.theme.bg.card};
    border: 1px solid ${props => props.theme.border};
    border-radius: 0; /* Carbon */
    padding: 20px;
    position: relative;
    transition: all 0.2s ease;
    box-shadow: none;
    overflow: hidden;

    &:hover {
        background: ${props => props.theme.bg.tertiary};
        border-color: #0f62fe;
    }
`;

const RemoveButton = styled.button`
    position: absolute;
    top: 12px;
    right: 12px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 0;
    color: #8d8d8d;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0;

    ${Card}:hover & {
        opacity: 1;
    }

    &:hover {
        background: #da1e28;
        color: white;
    }
`;

const ConfirmOverlay = styled.div`
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(2px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    z-index: 10;
    animation: ${fadeIn} 0.2s ease;
`;

const ConfirmText = styled.p`
    font-size: 0.9375rem;
    font-weight: 600;
    color: #0f172a;
`;

const ConfirmActions = styled.div`
    display: flex;
    gap: 8px;
`;

const CancelBtn = styled.button`
    padding: 6px 16px;
    background: transparent;
    border: 1px solid ${p => p.theme.border};
    border-radius: 0;
    font-size: 0.75rem;
    font-weight: 400;
    color: ${p => p.theme.text.secondary};
    cursor: pointer;

    &:hover {
        background: ${p => p.theme.bg.tertiary};
        color: ${p => p.theme.text.primary};
    }
`;

const DeleteBtn = styled.button`
    padding: 6px 16px;
    background: #da1e28;
    border: none;
    border-radius: 0;
    font-size: 0.75rem;
    font-weight: 400;
    color: white;
    cursor: pointer;

    &:hover {
        background: #bc111b;
    }
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
`;

const AvatarWrapper = styled.div`
    position: relative;
`;

const Avatar = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 0; /* Carbon */
    background: #0f62fe; /* Carbon Blue */
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.125rem;
    font-weight: 300;
    box-shadow: none;
`;

const StatusDot = styled.div`
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    background: ${props => props.color};
    border: 2px solid white;
    border-radius: 50%;
`;

const Info = styled.div`
    flex: 1;
    min-width: 0;
`;

const NameRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2px;
`;

const Name = styled.h4`
    font-size: 1rem;
    font-weight: 400; /* Carbon */
    color: ${p => p.theme.text.primary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const ManagerBadge = styled.span`
    padding: 2px 6px;
    background: rgba(15, 98, 254, 0.1);
    border: 1px solid #0f62fe;
    border-radius: 0;
    color: #0f62fe;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
`;

const Email = styled.p`
    font-size: 0.75rem;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const RoleSection = styled.div`
    margin-bottom: 16px;
`;

const RoleBadge = styled.span`
    padding: 4px 10px;
    background: ${p => p.theme.bg.tertiary};
    color: ${p => p.theme.text.secondary};
    border-radius: 0;
    border: 1px solid ${p => p.theme.border};
    font-size: 0.75rem;
    font-weight: 400;
    text-transform: capitalize;
`;

const StatsRow = styled.div`
    display: flex;
    align-items: center;
    border-top: 1px solid #f1f5f9;
    border-bottom: 1px solid #f1f5f9;
    padding: 12px 0;
    margin-bottom: 12px;
`;

const Stat = styled.div`
    flex: 1;
    text-align: center;
`;

const StatValue = styled.div`
    font-size: 1.125rem;
    font-weight: 400; /* Carbon */
    color: ${props => props.$color || props.theme.text.primary};
    line-height: 1;
    margin-bottom: 4px;
`;

const StatLabel = styled.div`
    font-size: 0.6875rem;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const Divider = styled.div`
    width: 1px;
    height: 24px;
    background: #f1f5f9;
`;

const Footer = styled.div`
    text-align: center;
`;

const ActiveText = styled.div`
    font-size: 0.75rem;
    font-weight: 500;
    color: ${props => props.$active ? '#22c55e' : '#94a3b8'};
`;

export default TeamMemberCard;
