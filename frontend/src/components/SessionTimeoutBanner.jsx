import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Timer, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SessionTimeoutBanner = () => {
    const { tokenExpiry, refreshTokens, logout } = useAuth();
    const [timeLeftMs, setTimeLeftMs] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Warning threshold (2 minutes)
    const WARNING_THRESHOLD = 2 * 60 * 1000; 

    useEffect(() => {
        if (!tokenExpiry) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = tokenExpiry - now;
            
            setTimeLeftMs(diff);

            if (diff > 0 && diff <= WARNING_THRESHOLD) {
                setIsVisible(true);
            } else if (diff <= 0) {
                setIsVisible(false);
                logout(); // Session expired
            } else {
                setIsVisible(false);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [tokenExpiry, logout]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        const success = await refreshTokens();
        if (success) {
            setIsVisible(false);
        }
        setIsRefreshing(false);
    };

    if (!isVisible || timeLeftMs === null) return null;

    const seconds = Math.floor((timeLeftMs / 1000) % 60);
    const minutes = Math.floor((timeLeftMs / (1000 * 60)) % 60);

    return (
        <BannerContainer>
            <BannerContent>
                <div className="left">
                    <WarningIcon>
                        <AlertTriangle size={20} />
                    </WarningIcon>
                    <TextSection>
                        <Title>Session Security Warning</Title>
                        <Subtitle>
                            Your session will expire in <strong>{minutes}m {seconds}s</strong> due to inactivity.
                        </Subtitle>
                    </TextSection>
                </div>
                
                <ActionSection>
                    <StayLoggedInBtn onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
                        Stay Logged In
                    </StayLoggedInBtn>
                    <LogoutBtn onClick={logout}>
                        Logout Now
                    </LogoutBtn>
                </ActionSection>
            </BannerContent>
        </BannerContainer>
    );
};

const slideDown = keyframes`
    from { transform: translateY(-100%); }
    to { transform: translateY(0); }
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const BannerContainer = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: #161616; /* IBM Carbon Black */
    border-bottom: 4px solid #f1c21b; /* Carbon Yellow 30 for Warning */
    color: white;
    padding: 12px 24px;
    animation: ${slideDown} 0.4s cubic-bezier(0.2, 0, 0.38, 0.9) forwards;
    font-family: 'IBM Plex Sans', sans-serif;

    @media print {
        display: none !important;
    }
`;

const BannerContent = styled.div`
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;

    .left {
        display: flex;
        align-items: center;
        gap: 16px;
    }
`;

const WarningIcon = styled.div`
    color: #f1c21b;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const TextSection = styled.div``;

const Title = styled.h4`
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0 0 2px;
    color: white;
`;

const Subtitle = styled.p`
    font-size: 0.8125rem;
    color: #c6c6c6;
    margin: 0;

    strong {
        color: #f1c21b;
        font-weight: 600;
    }
`;

const ActionSection = styled.div`
    display: flex;
    gap: 8px;
`;

const StayLoggedInBtn = styled.button`
    background: #0f62fe; /* Carbon Blue 60 */
    color: white;
    border: none;
    border-radius: 0;
    padding: 8px 16px;
    font-size: 0.875rem;
    font-weight: 400;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s;

    &:hover {
        background: #0043ce;
    }

    .spin {
        animation: ${spin} 1s linear infinite;
    }
`;

const LogoutBtn = styled.button`
    background: transparent;
    color: white;
    border: 1px solid #c6c6c6;
    border-radius: 0;
    padding: 8px 16px;
    font-size: 0.875rem;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: white;
    }
`;

export default SessionTimeoutBanner;
