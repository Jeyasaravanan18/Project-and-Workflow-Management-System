import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setError('');

        try {
            await api.post('/auth/forgot-password', { email });
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setError(err.response?.data?.message || 'Failed to send reset email. Contact administrator.');
        }
    };

    return (
        <PageContainer>
            <AuthCard>
                <HeaderSection>
                    <Title>Forgot password</Title>
                    <Subtitle>Enter your work email and we'll send a recovery link.</Subtitle>
                </HeaderSection>

                {status === 'success' ? (
                    <SuccessState>
                        <StatusIcon color="#24a148">
                            <CheckCircle2 size={32} />
                        </StatusIcon>
                        <SuccessTitle>Request sent</SuccessTitle>
                        <SuccessText>
                            A recovery link has been dispatched to <strong>{email}</strong>. Please check your inbox.
                        </SuccessText>
                        <PrimaryButton as={Link} to="/login">
                            Return to login
                        </PrimaryButton>
                    </SuccessState>
                ) : (
                    <Form onSubmit={handleSubmit}>
                        <FormGroup>
                            <Label htmlFor="email">Work email address</Label>
                            <InputWrapper>
                                <StyledInput
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e.g. user@company.com"
                                    required
                                />
                                <InputIcon><Mail size={18} /></InputIcon>
                            </InputWrapper>
                        </FormGroup>

                        {error && (
                            <ErrorContainer>
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </ErrorContainer>
                        )}

                        <PrimaryButton type="submit" disabled={status === 'loading'}>
                            {status === 'loading' ? (
                                <Loader2 size={20} className="spin" />
                            ) : (
                                'Send recovery link'
                            )}
                        </PrimaryButton>

                        <FooterLink to="/login">
                            <ArrowLeft size={16} />
                            Back to sign in
                        </FooterLink>
                    </Form>
                )}
            </AuthCard>
        </PageContainer>
    );
};

// --- Styled Components ---

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const PageContainer = styled.div`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f4f4f4; /* Carbon Gray 10 */
    font-family: 'IBM Plex Sans', sans-serif;
    padding: 24px;
`;

const AuthCard = styled.div`
    background: #ffffff;
    width: 100%;
    max-width: 440px;
    padding: 48px;
    border: 1px solid #e0e0e0;
    animation: ${fadeIn} 0.4s cubic-bezier(0.2, 0, 0.38, 1);
`;

const HeaderSection = styled.div`
    margin-bottom: 32px;
`;

const Title = styled.h2`
    font-size: 2rem;
    font-weight: 400;
    color: #161616;
    margin: 0 0 8px;
`;

const Subtitle = styled.p`
    font-size: 0.875rem;
    color: #525252;
    line-height: 1.4;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const Label = styled.label`
    font-size: 0.75rem;
    color: #525252;
    font-weight: 600;
`;

const InputWrapper = styled.div`
    position: relative;
`;

const StyledInput = styled.input`
    width: 100%;
    height: 48px;
    background: white;
    border: none;
    border-bottom: 1px solid #8d8d8d;
    padding: 0 48px 0 16px;
    font-size: 0.875rem;
    color: #161616;
    transition: all 0.2s;

    &:focus {
        outline: 2px solid #0f62fe;
        outline-offset: -2px;
    }
`;

const InputIcon = styled.div`
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #8d8d8d;
`;

const ErrorContainer = styled.div`
    background: #fff;
    border-left: 4px solid #da1e28;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: #161616;
    font-size: 0.8125rem;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    
    svg { color: #da1e28; }
`;

const PrimaryButton = styled.button`
    height: 48px;
    background: #0f62fe;
    color: white;
    border: none;
    padding: 0 16px;
    font-size: 0.875rem;
    font-weight: 400;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.2s;

    &:hover { background: #0043ce; }
    &:disabled { background: #c6c6c6; cursor: not-allowed; }

    .spin { animation: ${spin} 1s linear infinite; }
`;

const FooterLink = styled(Link)`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #0f62fe;
    font-size: 0.875rem;
    text-decoration: none;
    margin-top: 8px;
    &:hover { text-decoration: underline; }
`;

const SuccessState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
`;

const StatusIcon = styled.div`
    color: ${props => props.color};
    background: #f4f4f4;
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const SuccessTitle = styled.h3`
    font-size: 1.25rem;
    font-weight: 400;
    color: #161616;
    margin: 0;
`;

const SuccessText = styled.p`
    font-size: 0.875rem;
    color: #525252;
    line-height: 1.5;
`;

export default ForgotPassword;

