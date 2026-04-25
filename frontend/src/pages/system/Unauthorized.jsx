import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ShieldX, ArrowLeft } from 'lucide-react';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <Container>
            <Content>
                <IconWrapper>
                    <ShieldX size={80} />
                </IconWrapper>
                <Title>Access Denied</Title>
                <Message>
                    You don't have permission to access this page.
                </Message>
                <SubMessage>
                    Please contact your administrator if you believe this is an error.
                </SubMessage>
                <ButtonGroup>
                    <BackButton onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                        Go Back
                    </BackButton>
                    <HomeButton onClick={() => navigate('/')}>
                        Go to Dashboard
                    </HomeButton>
                </ButtonGroup>
            </Content>
        </Container>
    );
};

const Container = styled.div`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 24px;
`;

const Content = styled.div`
    text-align: center;
    max-width: 500px;
`;

const IconWrapper = styled.div`
    color: #ef4444;
    margin-bottom: 24px;
    
    svg {
        filter: drop-shadow(0 4px 6px rgba(239, 68, 68, 0.2));
    }
`;

const Title = styled.h1`
    font-size: 2.5rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 16px;
`;

const Message = styled.p`
    font-size: 1.125rem;
    color: #475569;
    margin-bottom: 8px;
`;

const SubMessage = styled.p`
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 32px;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    justify-content: center;
`;

const BackButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    color: #475569;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: #475569;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
`;

const HomeButton = styled.button`
    padding: 12px 24px;
    background: #475569;
    border: none;
    border-radius: 10px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #334155;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(71, 85, 105, 0.3);
    }
`;

export default Unauthorized;
