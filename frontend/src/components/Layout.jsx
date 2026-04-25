import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import Sidebar from './Sidebar';
import { OnboardingTour } from './OnboardingTour';
import SessionTimeoutBanner from './SessionTimeoutBanner';

const Layout = () => {
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const theme = useTheme();

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setSidebarCollapsed(true);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [location.pathname]);

    return (
        <AppLayout>
            <SessionTimeoutBanner />
            <OnboardingTour />
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                isMobile={isMobile}
            />

            <MainContent $collapsed={sidebarCollapsed}>
                <ContentWrapper className="animate-fade-in">
                    <Outlet />
                </ContentWrapper>
            </MainContent>

            {/* Mobile Toggle Button */}
            {isMobile && sidebarCollapsed && (
                <MobileToggle
                    onClick={() => setSidebarCollapsed(false)}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </MobileToggle>
            )}

            {/* Mobile overlay when sidebar is open */}
            {isMobile && !sidebarCollapsed && (
                <MobileOverlay
                    onClick={() => setSidebarCollapsed(true)}
                />
            )}
        </AppLayout>
    );
};

// Styled Components

const AppLayout = styled.div`
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: ${props => props.theme.bg.primary};
    color: ${props => props.theme.text.primary};
    transition: background-color 0.3s, color 0.3s;
`;

const MainContent = styled.main`
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    padding: 24px;
    background: ${props => props.theme.bg.tertiary};
    transition: margin-left 0.3s cubic-bezier(0.2, 0, 0, 1), background-color 0.3s;
`;

const ContentWrapper = styled.div`
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
`;

const MobileToggle = styled.button`
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 30;
    background: ${props => props.theme.bg.card};
    border: 1px solid ${props => props.theme.border};
    border-radius: 0; /* Carbon */
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: none; /* Carbon */
    cursor: pointer;
    color: ${props => props.theme.text.primary};

    &:hover {
        background: ${props => props.theme.bg.hover};
    }
`;

const MobileOverlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 40;
    backdrop-filter: blur(2px);
`;

export default Layout;
