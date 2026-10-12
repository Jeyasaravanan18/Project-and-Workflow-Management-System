import { Bell, Search, ChevronDown, Settings, LogOut, User, Sparkles, HelpCircle, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import useNotificationCount from '../hooks/useNotificationCount';

const TopBar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const { count: notifCount } = useNotificationCount();

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/' || path === '/admin') return 'Home';
        if (path.includes('/projects')) return 'Projects';
        if (path.includes('/automations')) return 'Automations';
        if (path.includes('/users')) return 'Users & Team';
        if (path.includes('/my-work')) return 'My Work';
        if (path.includes('/sprint-planner')) return 'Sprint Planner';
        if (path.includes('/ai-assistant')) return 'AI Assistant';
        if (path.includes('/integrations')) return 'Integrations';
        if (path.includes('/analytics')) return 'Analytics';
        if (path.includes('/notifications')) return 'Notifications';
        if (path.includes('/profile')) return 'Profile';
        return 'Dashboard';
    };

    return (
        <BarContainer>
            {/* Left: Page Context */}
            <LeftSection>
                <BreadcrumbText>{getPageTitle()}</BreadcrumbText>
            </LeftSection>

            {/* Right: Actions */}
            <RightSection>
                {/* Ask AI Pill Button */}
                <AIPillButton onClick={() => navigate('/ai-assistant')}>
                    <Sparkles size={15} color="#1E40AF" />
                    <span>Ask AI</span>
                </AIPillButton>

                {/* Notifications */}
                <IconButton onClick={() => navigate('/notifications')} title="Notifications">
                    <Bell size={18} />
                    {notifCount > 0 && <NotifBadge>{notifCount > 9 ? '9+' : notifCount}</NotifBadge>}
                </IconButton>

                {/* Settings */}
                <IconButton onClick={() => navigate('/profile')} title="Settings">
                    <Settings size={18} />
                </IconButton>

                {/* User Dropdown Pill */}
                <ProfileWrapper>
                    <ProfilePill onClick={() => setShowProfileMenu(!showProfileMenu)}>
                        <Building2 size={16} color="#6B7280" />
                        <OrgName>{user?.organizationName || user?.name || 'Workspace'}</OrgName>
                        <ChevronDown size={14} color="#6B7280" />
                    </ProfilePill>

                    {showProfileMenu && (
                        <>
                            <Backdrop onClick={() => setShowProfileMenu(false)} />
                            <DropdownMenu>
                                <DropdownHeader>
                                    <UserName>{user?.name}</UserName>
                                    <UserEmail>{user?.email}</UserEmail>
                                    <RoleBadge>{user?.role}</RoleBadge>
                                </DropdownHeader>
                                <DropdownItem onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}>
                                    <User size={15} />
                                    <span>Account Settings</span>
                                </DropdownItem>
                                <DropdownItem onClick={() => { setShowProfileMenu(false); navigate('/notifications'); }}>
                                    <Bell size={15} />
                                    <span>Notifications</span>
                                </DropdownItem>
                                <Divider />
                                <DropdownItem $danger onClick={() => { setShowProfileMenu(false); logout(); navigate('/login'); }}>
                                    <LogOut size={15} />
                                    <span>Log out</span>
                                </DropdownItem>
                            </DropdownMenu>
                        </>
                    )}
                </ProfileWrapper>
            </RightSection>
        </BarContainer>
    );
};

export default TopBar;

// Styled Components
const BarContainer = styled.header`
    height: 56px;
    background: #ffffff;
    border-bottom: 1px solid #E5E7EB;
    padding: 0 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 20;
    transition: background-color 0.2s, border-color 0.2s;
`;

const LeftSection = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const BreadcrumbText = styled.span`
    font-size: 0.9375rem;
    font-weight: 600;
    color: #111827;
`;

const RightSection = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
`;

const AIPillButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: #EEF2FF;
    border: 1px solid #E0E7FF;
    border-radius: 9999px;
    color: #4338CA;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #E0E7FF;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(79, 70, 229, 0.1);
    }
`;


const IconButton = styled.button`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: transparent;
    border: none;
    color: #4B5563;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    transition: all 0.15s ease;

    &:hover {
        background: #F3F4F6;
        color: #111827;
    }
`;

const NotifBadge = styled.span`
    position: absolute;
    top: 4px;
    right: 4px;
    background: #EF4444;
    color: white;
    font-size: 0.625rem;
    font-weight: 700;
    min-width: 16px;
    height: 16px;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border: 2px solid #ffffff;
`;

const ProfileWrapper = styled.div`
    position: relative;
`;

const ProfilePill = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: #F9FAFB;
    border: 1px solid #E5E7EB;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: #F3F4F6;
        border-color: #D1D5DB;
    }
`;

const OrgName = styled.span`
    font-size: 0.8125rem;
    font-weight: 600;
    color: #1F2937;
    max-width: 140px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Backdrop = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 40;
`;

const DropdownMenu = styled.div`
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 220px;
    background: #ffffff;
    border: 1px solid #E5E7EB;
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
    z-index: 50;
    padding: 6px;
    animation: fadeIn 0.15s ease-out;

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;

const DropdownHeader = styled.div`
    padding: 10px 12px;
    border-bottom: 1px solid #F3F4F6;
    margin-bottom: 4px;
`;

const UserName = styled.div`
    font-size: 0.875rem;
    font-weight: 600;
    color: #111827;
`;

const UserEmail = styled.div`
    font-size: 0.75rem;
    color: #6B7280;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const RoleBadge = styled.span`
    display: inline-block;
    margin-top: 6px;
    padding: 2px 8px;
    background: #EFF6FF;
    color: #065F46;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: capitalize;
`;

const DropdownItem = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border: none;
    background: transparent;
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 500;
    color: ${props => props.$danger ? '#DC2626' : '#374151'};
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;

    &:hover {
        background: ${props => props.$danger ? '#FEE2E2' : '#F3F4F6'};
        color: ${props => props.$danger ? '#B91C1C' : '#111827'};
    }
`;

const Divider = styled.div`
    height: 1px;
    background: #F3F4F6;
    margin: 4px 0;
`;
