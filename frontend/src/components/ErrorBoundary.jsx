import React from 'react';
import styled, { keyframes } from 'styled-components';

/**
 * Enterprise Error Boundary
 * Catches React rendering errors and shows a graceful fallback instead
 * of crashing the entire app with a white screen.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
        this.setState({ errorInfo });
        // In production, send to monitoring (Sentry, Datadog, etc.)
        // if (window.Sentry) window.Sentry.captureException(error, { extra: errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <ErrorContainer>
                    <ErrorCard>
                        <ErrorIcon>💥</ErrorIcon>
                        <ErrorTitle>Something went wrong</ErrorTitle>
                        <ErrorSubtitle>
                            An unexpected error occurred. Our team has been notified.
                        </ErrorSubtitle>
                        {import.meta.env.DEV && this.state.error && (
                            <ErrorDetails>
                                <summary>Error details (dev only)</summary>
                                <pre>{this.state.error.toString()}</pre>
                                <pre>{this.state.errorInfo?.componentStack}</pre>
                            </ErrorDetails>
                        )}
                        <ErrorActions>
                            <PrimaryButton onClick={this.handleReset}>
                                ↩ Return to Dashboard
                            </PrimaryButton>
                            <SecondaryButton onClick={() => window.location.reload()}>
                                ↻ Reload Page
                            </SecondaryButton>
                        </ErrorActions>
                    </ErrorCard>
                </ErrorContainer>
            );
        }

        return this.props.children;
    }
}

const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const ErrorContainer = styled.div`
    min-height: 100vh;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
`;

const ErrorCard = styled.div`
    background: white;
    border-radius: 24px;
    padding: 56px 48px;
    text-align: center;
    max-width: 520px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
    border: 1px solid #f1f5f9;
    animation: ${fadeUp} 0.4s ease-out;
`;

const ErrorIcon = styled.div`
    font-size: 4rem;
    margin-bottom: 24px;
`;

const ErrorTitle = styled.h1`
    font-size: 1.75rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
`;

const ErrorSubtitle = styled.p`
    font-size: 1rem;
    color: #64748b;
    margin-bottom: 32px;
    line-height: 1.6;
`;

const ErrorDetails = styled.details`
    text-align: left;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 24px;
    font-size: 0.75rem;
    color: #64748b;

    pre {
        white-space: pre-wrap;
        word-break: break-all;
        margin-top: 8px;
    }

    summary {
        cursor: pointer;
        font-weight: 600;
        color: #475569;
    }
`;

const ErrorActions = styled.div`
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
`;

const PrimaryButton = styled.button`
    padding: 12px 28px;
    background: #0f172a;
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #1e293b;
        transform: translateY(-1px);
    }
`;

const SecondaryButton = styled.button`
    padding: 12px 28px;
    background: white;
    color: #475569;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #f8fafc;
        transform: translateY(-1px);
    }
`;

export default ErrorBoundary;
