import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import styled from 'styled-components';
import { Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

const AutomationHistory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [executions, setExecutions] = useState([]);
    const [automation, setAutomation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedExecution, setExpandedExecution] = useState(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [automationRes, executionsRes] = await Promise.all([
                api.get(`/automations/${id}`),
                api.get(`/automations/${id}/executions`)
            ]);
            setAutomation(automationRes.data.automation);
            setExecutions(executionsRes.data.executions || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle size={18} color="#1E40AF" />;
            case 'failed':
                return <XCircle size={18} color="#dc2626" />;
            case 'partial':
                return <AlertCircle size={18} color="#d97706" />;
            default:
                return <Clock size={18} color="#64748b" />;
        }
    };

    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'completed':
                return { bg: '#EFF6FF', color: '#1E40AF', border: '#a7f3d0' };
            case 'failed':
                return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
            case 'partial':
                return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
            default:
                return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
        }
    };

    if (loading) {
        return (
            <Container>
                <LoadingState>Loading execution history...</LoadingState>
            </Container>
        );
    }

    return (
        <Container>
            <BackNav onClick={() => navigate('/admin/automations')}>
                <ArrowLeft size={16} /> Back to Automations
            </BackNav>

            <Header>
                <div>
                    <Badge><Clock size={12} /> Execution Logs</Badge>
                    <Title>Execution History</Title>
                    {automation && <Subtitle>Workflow: <strong>{automation.name}</strong></Subtitle>}
                </div>
            </Header>

            {executions.length === 0 ? (
                <EmptyState>
                    <Clock size={48} />
                    <h3>No executions recorded</h3>
                    <p>This automation has not triggered any runs yet.</p>
                </EmptyState>
            ) : (
                <ExecutionList>
                    {executions.map(execution => {
                        const style = getStatusBadgeStyle(execution.status);
                        const isExpanded = expandedExecution === execution._id;
                        return (
                            <ExecutionCard key={execution._id}>
                                <ExecutionHeader onClick={() => setExpandedExecution(isExpanded ? null : execution._id)}>
                                    <ExecutionInfo>
                                        {getStatusIcon(execution.status)}
                                        <div>
                                            <ExecutionDate>
                                                {new Date(execution.triggeredAt).toLocaleString()}
                                            </ExecutionDate>
                                            <ExecutionMeta>
                                                Triggered by: {execution.triggeredBy || 'system'} • Duration: {execution.duration || 0}ms
                                            </ExecutionMeta>
                                        </div>
                                    </ExecutionInfo>
                                    <StatusBadge $bg={style.bg} $color={style.color} $border={style.border}>
                                        {execution.status}
                                    </StatusBadge>
                                    {isExpanded ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                                </ExecutionHeader>

                                {isExpanded && (
                                    <ExecutionDetails>
                                        {execution.steps && execution.steps.length > 0 ? (
                                            <StepsList>
                                                {execution.steps.map((step, index) => (
                                                    <StepItem key={index}>
                                                        <StepNumber $status={step.status}>
                                                            {index + 1}
                                                        </StepNumber>
                                                        <StepContent>
                                                            <StepTitle>
                                                                {step.actionType.replace(/_/g, ' ')}
                                                            </StepTitle>
                                                            <StepStatus $status={step.status}>
                                                                Status: {step.status}
                                                            </StepStatus>
                                                            {step.error && (
                                                                <ErrorMessage>{step.error}</ErrorMessage>
                                                            )}
                                                            {step.result && (
                                                                <ResultMessage>
                                                                    {JSON.stringify(step.result, null, 2)}
                                                                </ResultMessage>
                                                            )}
                                                        </StepContent>
                                                    </StepItem>
                                                ))}
                                            </StepsList>
                                        ) : (
                                            <NoSteps>No detailed step records found for this execution run.</NoSteps>
                                        )}

                                        {execution.error && (
                                            <ErrorBox>
                                                <strong>Error:</strong> {execution.error.message || String(execution.error)}
                                            </ErrorBox>
                                        )}
                                    </ExecutionDetails>
                                )}
                            </ExecutionCard>
                        );
                    })}
                </ExecutionList>
            )}
        </Container>
    );
};

// Styled Components
const Container = styled.div`
    padding: 32px;
    max-width: 1100px;
    margin: 0 auto;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const BackNav = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 0.84rem;
    font-weight: 500;
    cursor: pointer;
    margin-bottom: 18px;
    padding: 0;
    transition: color 0.15s;

    &:hover {
        color: #111827;
    }
`;

const Header = styled.div`
    margin-bottom: 24px;
`;

const Badge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #EFF6FF;
    color: #1E40AF;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid #a7f3d0;
    margin-bottom: 8px;
`;

const Title = styled.h1`
    font-size: 1.875rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
    letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
    color: #64748b;
    margin-top: 4px;
    font-size: 0.875rem;
    strong {
        color: #111827;
    }
`;

const ExecutionList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const ExecutionCard = styled.div`
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    transition: all 0.15s ease;

    &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.04);
    }
`;

const ExecutionHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 22px;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
        background: #f8fafc;
    }
`;

const ExecutionInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
`;

const ExecutionDate = styled.div`
    font-weight: 600;
    color: #111827;
    font-size: 0.9rem;
`;

const ExecutionMeta = styled.div`
    font-size: 0.78rem;
    color: #64748b;
    margin-top: 3px;
`;

const StatusBadge = styled.span`
    padding: 4px 12px;
    background: ${props => props.$bg};
    color: ${props => props.$color};
    border: 1px solid ${props => props.$border};
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
    margin-right: 14px;
`;

const ExecutionDetails = styled.div`
    padding: 20px 22px;
    background: #f8fafc;
    border-top: 1px solid #e5e7eb;
`;

const StepsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const StepItem = styled.div`
    display: flex;
    gap: 12px;
    align-items: flex-start;
    background: #ffffff;
    padding: 14px;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
`;

const StepNumber = styled.div`
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.75rem;
    flex-shrink: 0;
    background: ${props => {
        switch (props.$status) {
            case 'completed': return '#EFF6FF';
            case 'failed': return '#fef2f2';
            default: return '#f1f5f9';
        }
    }};
    color: ${props => {
        switch (props.$status) {
            case 'completed': return '#1E40AF';
            case 'failed': return '#dc2626';
            default: return '#64748b';
        }
    }};
    border: 1px solid ${props => {
        switch (props.$status) {
            case 'completed': return '#a7f3d0';
            case 'failed': return '#fecaca';
            default: return '#e2e8f0';
        }
    }};
`;

const StepContent = styled.div`
    flex: 1;
`;

const StepTitle = styled.div`
    font-weight: 600;
    color: #111827;
    font-size: 0.85rem;
    text-transform: capitalize;
    margin-bottom: 2px;
`;

const StepStatus = styled.div`
    font-size: 0.75rem;
    color: ${props => {
        switch (props.$status) {
            case 'completed': return '#1E40AF';
            case 'failed': return '#dc2626';
            default: return '#64748b';
        }
    }};
    text-transform: capitalize;
    font-weight: 500;
`;

const ErrorMessage = styled.div`
    margin-top: 8px;
    padding: 8px 12px;
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
    border-radius: 8px;
    font-size: 0.8rem;
`;

const ResultMessage = styled.pre`
    margin-top: 8px;
    padding: 10px 12px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 0.75rem;
    font-family: monospace;
    overflow-x: auto;
    color: #374151;
`;

const ErrorBox = styled.div`
    margin-top: 14px;
    padding: 12px 14px;
    background: #fef2f2;
    color: #dc2626;
    border-radius: 10px;
    border: 1px solid #fecaca;
    font-size: 0.84rem;
`;

const NoSteps = styled.div`
    text-align: center;
    padding: 1.5rem;
    color: #64748b;
    font-size: 0.85rem;
`;

const LoadingState = styled.div`
    text-align: center;
    padding: 4rem 2rem;
    color: #64748b;
    font-size: 0.95rem;
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 4rem 2rem;
    color: #64748b;
    background: #ffffff;
    border-radius: 14px;
    border: 1px solid #e5e7eb;

    svg {
        color: #94a3b8;
        margin-bottom: 12px;
    }

    h3 {
        font-size: 1.15rem;
        font-weight: 700;
        color: #111827;
        margin: 0 0 4px 0;
    }

    p {
        font-size: 0.85rem;
        margin: 0;
    }
`;

export default AutomationHistory;
