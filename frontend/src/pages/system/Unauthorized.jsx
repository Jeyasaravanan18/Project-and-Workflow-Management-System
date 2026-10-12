import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <Container>
            <Card>
                <IconWrapper>
                    <ShieldX size={48} />
                </IconWrapper>
                <Title>Access Restricted</Title>
                <Message>
                    You don't have permission to view or manage this workspace resource.
                </Message>
                <SubMessage>
                    Please contact your organization administrator if your role needs elevated access.
                </SubMessage>
                <ButtonGroup>
                    <BackButton onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} />
                        Go Back
                    </BackButton>
                    <HomeButton onClick={() => navigate('/')}>
                        <Home size={16} />
                        Dashboard
                    </HomeButton>
                </ButtonGroup>
            </Card>
        </Container>
    );
};

const Container = styled.div`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    padding: 32px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Card = styled.div`
    text-align: center;
    max-width: 480px;
    width: 100%;
    background: #ffffff;
    border-radius: 14px;
    padding: 48px 40px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
`;

const IconWrapper = styled.div`
    color: #dc2626;
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
`;

const Title = styled.h1`
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 8px 0;
    letter-spacing: -0.02em;
`;

const Message = styled.p`
    font-size: 0.9rem;
    color: #475569;
    margin: 0 0 6px 0;
`;

const SubMessage = styled.p`
    font-size: 0.8125rem;
    color: #94a3b8;
    margin: 0 0 28px 0;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
`;

const BackButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 9999px;
    color: #374151;
    font-weight: 500;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: #f8fafc;
        border-color: #d1d5db;
    }
`;

const HomeButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: #111827;
    border: none;
    border-radius: 9999px;
    color: white;
    font-weight: 500;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: #1E40AF;
    }
`;

export default Unauthorized;
