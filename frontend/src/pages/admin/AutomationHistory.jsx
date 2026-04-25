import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import styled from 'styled-components';
import { Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const AutomationHistory = () => {
    const { id } = useParams();
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
                return <CheckCircle size={20} color="#22c55e" />;
            case 'failed':
                return <XCircle size={20} color="#ef4444" />;
            case 'partial':
                return <AlertCircle size={20} color="#f59e0b" />;
            default:
                return <Clock size={20} color="#64748b" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return '#dcfce7';
            case 'failed':
                return '#fee2e2';
            case 'partial':
                return '#fef3c7';
            default:
                return '#f1f5f9';
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
            <Header>
                <div>
                    <h1>Execution History</h1>
                    {automation && <Subtitle>{automation.name}</Subtitle>}
                </div>
            </Header>

            {executions.length === 0 ? (
                <EmptyState>
                    <Clock size={64} />
                    <h3>No executions yet</h3>
                    <p>This automation hasn't run yet</p>
                </EmptyState>
            ) : (
                <ExecutionList>
                    {executions.map(execution => (
                        <ExecutionCard key={execution._id}>
                            <ExecutionHeader onClick={() => setExpandedExecution(
                                expandedExecution === execution._id ? null : execution._id
                            )}>
                                <ExecutionInfo>
                                    {getStatusIcon(execution.status)}
                                    <div>
                                        <ExecutionDate>
                                            {new Date(execution.triggeredAt).toLocaleString()}
                                        </ExecutionDate>
                                        <ExecutionMeta>
                                            Triggered by: {execution.triggeredBy} •
                                            Duration: {execution.duration}ms
                                        </ExecutionMeta>
                                    </div>
                                </ExecutionInfo>
                                <StatusBadge color={getStatusColor(execution.status)}>
                                    {execution.status}
                                </StatusBadge>
                                {expandedExecution === execution._id ?
                                    <ChevronUp size={20} /> : <ChevronDown size={20} />
                                }
                            </ExecutionHeader>

                            {expandedExecution === execution._id && (
                                <ExecutionDetails>
                                    {execution.steps && execution.steps.length > 0 ? (
                                        <StepsList>
                                            {execution.steps.map((step, index) => (
                                                <StepItem key={index}>
                                                    <StepNumber status={step.status}>
                                                        {index + 1}
                                                    </StepNumber>
                                                    <StepContent>
                                                        <StepTitle>
                                                            {step.actionType.replace(/_/g, ' ')}
                                                        </StepTitle>
                                                        <StepStatus status={step.status}>
                                                            {step.status}
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
                                        <NoSteps>No step details available</NoSteps>
                                    )}

                                    {execution.error && (
                                        <ErrorBox>
                                            <strong>Error:</strong> {execution.error.message}
                                        </ErrorBox>
                                    )}
                                </ExecutionDetails>
                            )}
                        </ExecutionCard>
                    ))}
                </ExecutionList>
            )}
        </Container>
    );
};

// Styled Components
const Container = styled.div`
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
`;

const Header = styled.div`
    margin-bottom: 2rem;

    h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
    }
`;

const Subtitle = styled.p`
    color: #64748b;
    margin-top: 0.5rem;
    font-size: 0.95rem;
`;

const ExecutionList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const ExecutionCard = styled.div`
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s;

    &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
`;

const ExecutionHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: #f8fafc;
    }
`;

const ExecutionInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
`;

const ExecutionDate = styled.div`
    font-weight: 600;
    color: #1e293b;
    font-size: 0.95rem;
`;

const ExecutionMeta = styled.div`
    font-size: 0.85rem;
    color: #64748b;
    margin-top: 0.25rem;
`;

const StatusBadge = styled.span`
    padding: 0.35rem 0.75rem;
    background: ${props => props.color};
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: capitalize;
    margin-right: 1rem;
`;

const ExecutionDetails = styled.div`
    padding: 1.25rem;
    background: #f8fafc;
    border-top: 2px solid #e2e8f0;
`;

const StepsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const StepItem = styled.div`
    display: flex;
    gap: 1rem;
    align-items: flex-start;
`;

const StepNumber = styled.div`
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    flex-shrink: 0;
    background: ${props => {
        switch (props.status) {
            case 'completed': return '#dcfce7';
            case 'failed': return '#fee2e2';
            default: return '#f1f5f9';
        }
    }};
    color: ${props => {
        switch (props.status) {
            case 'completed': return '#16a34a';
            case 'failed': return '#dc2626';
            default: return '#64748b';
        }
    }};
`;

const StepContent = styled.div`
    flex: 1;
`;

const StepTitle = styled.div`
    font-weight: 600;
    color: #1e293b;
    text-transform: capitalize;
    margin-bottom: 0.25rem;
`;

const StepStatus = styled.div`
    font-size: 0.85rem;
    color: ${props => {
        switch (props.status) {
            case 'completed': return '#16a34a';
            case 'failed': return '#dc2626';
            default: return '#64748b';
        }
    }};
    text-transform: capitalize;
`;

const ErrorMessage = styled.div`
    margin-top: 0.5rem;
    padding: 0.75rem;
    background: #fee2e2;
    color: #dc2626;
    border-radius: 6px;
    font-size: 0.85rem;
`;

const ResultMessage = styled.pre`
    margin-top: 0.5rem;
    padding: 0.75rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.8rem;
    overflow-x: auto;
`;

const ErrorBox = styled.div`
    margin-top: 1rem;
    padding: 1rem;
    background: #fee2e2;
    color: #dc2626;
    border-radius: 8px;
    border-left: 4px solid #dc2626;
`;

const NoSteps = styled.div`
    text-align: center;
    padding: 2rem;
    color: #64748b;
`;

const LoadingState = styled.div`
    text-align: center;
    padding: 4rem 2rem;
    color: #64748b;
    font-size: 1.1rem;
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 4rem 2rem;
    color: #64748b;

    svg {
        color: #cbd5e1;
        margin-bottom: 1rem;
    }

    h3 {
        font-size: 1.5rem;
        color: #475569;
        margin-bottom: 0.5rem;
    }
`;

export default AutomationHistory;
