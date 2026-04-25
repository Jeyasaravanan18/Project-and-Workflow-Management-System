import { Clock, AlertCircle, User, GripVertical } from 'lucide-react';
import { format, isPast } from 'date-fns';
import styled from 'styled-components';

const TaskCard = ({ task, onClick }) => {
    const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !task.completedAt;

    const getPriorityConfig = (priority) => {
        switch (priority) {
            case 'high':
                return {
                    color: '#da1e28',
                    bg: 'rgba(218, 30, 40, 0.1)',
                    border: '#da1e28'
                };
            case 'medium':
                return {
                    color: '#0f62fe',
                    bg: 'rgba(15, 98, 254, 0.1)',
                    border: '#0f62fe'
                };
            case 'low':
                return {
                    color: '#198038',
                    bg: 'rgba(25, 128, 56, 0.1)',
                    border: '#198038'
                };
            default:
                return {
                    color: '#8d8d8d',
                    bg: 'rgba(141, 141, 141, 0.1)',
                    border: '#8d8d8d'
                };
        }
    };

    const priorityConfig = getPriorityConfig(task.priority);

    return (
        <Card onClick={onClick}>
            <PriorityStripe $color={priorityConfig.color} />
            <CardContent>
                <TitleRow>
                    <Title>{task.title}</Title>
                    <PriorityBadge $config={priorityConfig}>
                        {task.priority || 'med'}
                    </PriorityBadge>
                </TitleRow>

                <MetaRow>
                    {task.assignedTo && (
                        <Assignee>
                            <Avatar>{task.assignedTo.name?.charAt(0) || 'U'}</Avatar>
                            <AssigneeName>{task.assignedTo.name}</AssigneeName>
                        </Assignee>
                    )}

                    {task.dueDate && (
                        <DueDate $isOverdue={isOverdue}>
                            {isOverdue ? <AlertCircle size={14} /> : <Clock size={14} />}
                            <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                        </DueDate>
                    )}
                </MetaRow>
            </CardContent>
        </Card>
    );
};

// Styled Components
const Card = styled.div`
    background: ${props => props.theme.bg.card};
    border-radius: 0; /* Carbon */
    border: 1px solid ${props => props.theme.border};
    margin-bottom: 12px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.2s ease;
    box-shadow: none;

    &:hover {
        background: ${props => props.theme.bg.tertiary};
        border-color: #0f62fe;
    }
`;

const PriorityStripe = styled.div`
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${props => props.$color};
`;

const CardContent = styled.div`
    padding: 16px 16px 16px 20px; 
`;

const TitleRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
`;

const Title = styled.h4`
    font-size: 0.875rem;
    font-weight: 400; /* Carbon */
    color: ${props => props.theme.text.primary};
    line-height: 1.4;
    margin: 0;
`;

const PriorityBadge = styled.span`
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 0; /* Carbon */
    background: ${props => props.$config.bg};
    color: ${props => props.$config.color};
    border: 1px solid ${props => props.$config.color};
    flex-shrink: 0;
`;

const MetaRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
`;

const Assignee = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const Avatar = styled.div`
    width: 24px;
    height: 24px;
    border-radius: 0; /* Carbon */
    background: #0f62fe; /* Carbon Blue */
    color: white;
    font-size: 0.75rem;
    font-weight: 400;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: none;
`;

const AssigneeName = styled.span`
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
`;

const DueDate = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    color: ${props => props.$isOverdue ? '#da1e28' : '#8d8d8d'};
    
    background: ${props => props.$isOverdue ? 'rgba(218, 30, 40, 0.1)' : 'transparent'};
    padding: ${props => props.$isOverdue ? '2px 6px' : '0'};
    border: ${props => props.$isOverdue ? '1px solid #da1e28' : 'none'};
    border-radius: 0;
`;

export default TaskCard;
