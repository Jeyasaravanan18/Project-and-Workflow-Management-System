import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

/**
 * Enterprise 404 Not Found page.
 * Shown for all unmatched routes.
 */
const NotFound = () => {
    const navigate = useNavigate();

    return (
        <Container>
            <Card>
                <Code>404</Code>
                <Title>Page not found</Title>
                <Subtitle>
                    The page you're looking for doesn't exist or has been moved.
                </Subtitle>
                <Actions>
                    <PrimaryBtn onClick={() => navigate('/')}>
                        <Home size={18} />
                        Back to Dashboard
                    </PrimaryBtn>
                    <SecondaryBtn onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} />
                        Go Back
                    </SecondaryBtn>
                </Actions>
                <Hint>
                    <Search size={14} />
                    Try using the global search to find what you're looking for.
                </Hint>
            </Card>
        </Container>
    );
};

const float = keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
`;

const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
    min-height: 100vh;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
`;

const Card = styled.div`
    background: white;
    border-radius: 28px;
    padding: 64px 56px;
    text-align: center;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.07);
    border: 1px solid #f1f5f9;
    animation: ${fadeUp} 0.4s ease-out;
`;

const Code = styled.div`
    font-size: 7rem;
    font-weight: 900;
    color: #e2e8f0;
    line-height: 1;
    letter-spacing: -0.04em;
    margin-bottom: 16px;
    animation: ${float} 4s ease-in-out infinite;
    background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
`;

const Title = styled.h1`
    font-size: 2rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
    font-size: 1rem;
    color: #64748b;
    line-height: 1.6;
    margin-bottom: 40px;
`;

const Actions = styled.div`
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 32px;
`;

const PrimaryBtn = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    background: #0f172a;
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #1e293b;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(15,23,42,0.2);
    }
`;

const SecondaryBtn = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    background: white;
    color: #475569;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #f8fafc;
        transform: translateY(-2px);
    }
`;

const Hint = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 0.8rem;
    color: #94a3b8;
`;

export default NotFound;
