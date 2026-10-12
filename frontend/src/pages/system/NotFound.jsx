import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <Container>
            <Card>
                <Code>404</Code>
                <Title>Page not found</Title>
                <Subtitle>
                    The page you are looking for doesn't exist or has been relocated.
                </Subtitle>
                <Actions>
                    <PrimaryBtn onClick={() => navigate('/')}>
                        <Home size={16} />
                        Back to Dashboard
                    </PrimaryBtn>
                    <SecondaryBtn onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} />
                        Go Back
                    </SecondaryBtn>
                </Actions>
                <Hint>
                    <Search size={14} />
                    Try using the top navigation or search to find what you're looking for.
                </Hint>
            </Card>
        </Container>
    );
};

const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
    min-height: 100vh;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Card = styled.div`
    background: #ffffff;
    border-radius: 14px;
    padding: 48px 40px;
    text-align: center;
    max-width: 480px;
    width: 100%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    border: 1px solid #e5e7eb;
    animation: ${fadeUp} 0.3s ease-out;
`;

const Code = styled.div`
    font-size: 5.5rem;
    font-weight: 800;
    color: #e2e8f0;
    line-height: 1;
    letter-spacing: -0.04em;
    margin-bottom: 16px;
    background: linear-gradient(135deg, #008060 0%, #a7f3d0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
`;

const Title = styled.h1`
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 8px 0;
    letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
    font-size: 0.875rem;
    color: #64748b;
    line-height: 1.5;
    margin: 0 0 28px 0;
`;

const Actions = styled.div`
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 24px;
`;

const PrimaryBtn = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: #111827;
    color: white;
    border: none;
    border-radius: 9999px;
    font-weight: 500;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: #008060;
    }
`;

const SecondaryBtn = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: white;
    color: #374151;
    border: 1px solid #e5e7eb;
    border-radius: 9999px;
    font-weight: 500;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: #f8fafc;
        border-color: #d1d5db;
    }
`;

const Hint = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 0.78rem;
    color: #94a3b8;
`;

export default NotFound;
