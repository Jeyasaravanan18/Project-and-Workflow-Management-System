import React from 'react';
import styled from 'styled-components';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GetStartedWidget = ({
    title = 'Get started with ProjectFlow',
    actionText = 'Create project',
    onAction,
    actionPath = '/projects',
    steps = [
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
    ]
}) => {
    const navigate = useNavigate();

    const handleMainAction = () => {
        if (onAction) {
            onAction();
        } else if (actionPath) {
            navigate(actionPath);
        }
    };

    const handleStepClick = (step) => {
        if (step.onClick) {
            step.onClick();
        } else if (step.linkPath) {
            navigate(step.linkPath);
        }
    };

    return (
        <WidgetCard>
            <WidgetHeader>
                <WidgetTitle>{title}</WidgetTitle>
                {(actionText || onAction) && (
                    <HeaderActionBtn onClick={handleMainAction}>
                        {actionText}
                    </HeaderActionBtn>
                )}
            </WidgetHeader>

            <StepsGrid $columns={steps.length}>
                {steps.map((step, idx) => (
                    <StepCard key={idx} onClick={() => handleStepClick(step)}>
                        <NumberBadgeWrapper>
                            <GlowCircle />
                            <BigNumber>{step.number || idx + 1}</BigNumber>
                        </NumberBadgeWrapper>
                        <StepContent>
                            <StepTitle>{step.title}</StepTitle>
                            <StepDescription>{step.description}</StepDescription>
                            {step.linkText && (
                                <StepLink>
                                    <span>{step.linkText}</span>
                                    <ArrowRight size={14} className="arrow" />
                                </StepLink>
                            )}
                        </StepContent>
                    </StepCard>
                ))}
            </StepsGrid>
        </WidgetCard>
    );
};

export default GetStartedWidget;

// Styled Components
const WidgetCard = styled.div`
    background: ${props => props.theme.bg.card};
    border: 1px solid ${props => props.theme.border};
    border-radius: 16px;
    padding: 24px 28px;
    box-shadow: ${props => props.theme.shadow.sm};
    margin-bottom: 24px;
    transition: background-color 0.2s, border-color 0.2s;
`;

const WidgetHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    gap: 16px;
    flex-wrap: wrap;
`;

const WidgetTitle = styled.h2`
    font-size: 1.25rem;
    font-weight: 700;
    color: ${props => props.theme.text.primary};
    margin: 0;
    letter-spacing: -0.02em;
`;

const HeaderActionBtn = styled.button`
    padding: 8px 20px;
    background: ${props => props.theme.mode === 'dark' ? '#1E40AF' : '#111827'};
    color: #ffffff;
    border: none;
    border-radius: 9999px;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background: ${props => props.theme.mode === 'dark' ? '#2563EB' : '#1E40AF'};
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(30, 64, 175, 0.2);
    }
`;

const StepsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(${props => props.$columns || 2}, 1fr);
    gap: 16px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const StepCard = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 18px;
    padding: 20px 22px;
    background: ${props => props.theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.45)' : '#F8FAFC'};
    border: 1px solid ${props => props.theme.mode === 'dark' ? '#1E293B' : '#F1F5F9'};
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: ${props => props.theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.75)' : '#EFF6FF'};
        border-color: ${props => props.theme.mode === 'dark' ? '#2563EB' : '#BFDBFE'};
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(30, 64, 175, 0.08);

        .arrow {
            transform: translateX(4px);
        }
    }
`;

const NumberBadgeWrapper = styled.div`
    position: relative;
    width: 44px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
`;

const GlowCircle = styled.div`
    position: absolute;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${props => props.theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : '#E0E7FF'};
    top: 6px;
    left: 2px;
    z-index: 1;
`;

const BigNumber = styled.span`
    font-size: 2.6rem;
    font-weight: 800;
    line-height: 1;
    color: ${props => props.theme.mode === 'dark' ? '#60A5FA' : '#1D4ED8'};
    position: relative;
    z-index: 2;
    letter-spacing: -0.04em;
    font-family: inherit;
`;

const StepContent = styled.div`
    flex: 1;
    min-width: 0;
`;

const StepTitle = styled.h3`
    font-size: 0.95rem;
    font-weight: 700;
    color: ${props => props.theme.text.primary};
    margin: 0 0 6px 0;
    letter-spacing: -0.01em;
`;

const StepDescription = styled.p`
    font-size: 0.8125rem;
    color: ${props => props.theme.text.secondary};
    line-height: 1.45;
    margin: 0 0 12px 0;
`;

const StepLink = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8125rem;
    font-weight: 600;
    color: ${props => props.theme.mode === 'dark' ? '#60A5FA' : '#1E40AF'};

    .arrow {
        transition: transform 0.2s ease;
    }
`;
