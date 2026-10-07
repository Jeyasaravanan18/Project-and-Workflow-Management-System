
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import styled, { css, keyframes } from 'styled-components';
import {
    LayoutDashboard, FolderKanban, CheckSquare, Users, BarChart3, Settings,
    Bell, LogOut, ChevronDown, ChevronRight, Building2, Activity,
    AlertTriangle, Menu, X, ArrowLeft, ArrowRight, Plug, Zap, MessageSquare,
    Moon, Sun, Clock, History, Sparkles
} from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import OnlineUsersPanel from './OnlineUsersPanel';
import useNotificationCount from '../hooks/useNotificationCount';
import useRecentlyViewed from '../hooks/useRecentlyViewed';

const Sidebar = ({ collapsed, onToggle, isMobile }) => {
    const { user, logout } = useAuth();
    const { themeMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { count: notifCount } = useNotificationCount();
    const { recentItems } = useRecentlyViewed();

    // Debug logging
    useEffect(() => {
        console.log('[Sidebar] User:', user);
        console.log('[Sidebar] User role:', user?.role);
        console.log('[Sidebar] Collapsed:', collapsed);
    }, [user, collapsed]);

    // Internal expanded state for sub-menus
    const [expandedSections, setExpandedSections] = useState({
        admin: true,
        manager: true,
        system: true
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSection = (section) => {
        if (collapsed) onToggle(); // Expand sidebar if clicking a section
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Navigation Data
    const navigation = {
        general: [
            { path: '/ai-assistant', label: 'AI Assistant', icon: MessageSquare, roles: ['admin', 'manager', 'member'] },
            { path: '/my-work', label: 'My Work', icon: CheckSquare, roles: ['manager', 'member'] },
            { path: '/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'manager', 'member'], badge: notifCount },
        ],
        admin: {
            label: 'Organization',
            icon: Building2,
            items: [
                { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
                { path: '/admin/project-scaffolder', label: 'AI Scaffolder', icon: Sparkles },
                { path: '/admin/users', label: 'User Management', icon: Users },
                { path: '/admin/analytics', label: 'Activity Logs', icon: Activity },
                { path: '/admin/integrations', label: 'Integrations', icon: Plug },
            ]
        },
        manager: {
            label: 'Projects & Workflows',
            icon: FolderKanban,
            items: [
                { path: '/projects', label: 'All Projects', icon: FolderKanban },
                { path: '/sprint-planner', label: 'Sprint Planner', icon: Sparkles },
                { path: '/analytics/bottlenecks', label: 'Bottleneck Analysis', icon: AlertTriangle },
                { path: '/admin/automations', label: 'Automations', icon: Zap },
            ]
        },
        system: {
            label: 'Reports',
            icon: BarChart3,
            items: [
                { path: '/analytics/workload', label: 'Workload', icon: BarChart3 },
                { path: '/analytics/performance', label: 'Performance', icon: Zap },
            ]
        }
    };

    return (
        <SidebarContainer $collapsed={collapsed} $mobile={isMobile}>
            {/* Header */}
            <Header $collapsed={collapsed}>
                <Brand>
                    <LogoIcon>
                        <Building2 size={24} color="white" />
                    </LogoIcon>
                    <BrandText $collapsed={collapsed}>
                        ProjectFlow
                    </BrandText>
                </Brand>
                <ToggleBtn onClick={onToggle}>
                    {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} style={{ transform: 'rotate(90deg)' }} />}
                </ToggleBtn>
            </Header>

            <SearchWrapper $collapsed={collapsed}>
                <GlobalSearch />
            </SearchWrapper>

            {/* Navigation Scroller */}
            <NavScroller>
                <SectionLabel $collapsed={collapsed}>Workspace</SectionLabel>
                {navigation.general.filter(item => item.roles.includes(user?.role)).map(item => (
                    <NavItem
                        key={item.path}
                        to={item.path}
                        title={collapsed ? item.label : ''}
                        $collapsed={collapsed}
                        data-tour={item.path === '/my-work' ? 'sidebar-my-work' : undefined}
                    >
                        <IconWrapper><item.icon size={20} /></IconWrapper>
                        <Label $collapsed={collapsed}>{item.label}</Label>
                        {item.badge > 0 && (
                            <NotifBadge $collapsed={collapsed}>
                                {item.badge > 99 ? '99+' : item.badge}
                            </NotifBadge>
                        )}
                        {collapsed && <Tooltip>{item.label}{item.badge > 0 ? ` (${item.badge})` : ''}</Tooltip>}
                    </NavItem>
                ))}

                <Divider />

                {/* Role Based Sections */}
                {user?.role === 'admin' && (
                    <>
                        <SectionToggle onClick={() => toggleSection('admin')} $collapsed={collapsed}>
                            <div className="flex-row">
                                <navigation.admin.icon size={16} className="section-icon" />
                                <Label $collapsed={collapsed}>{navigation.admin.label}</Label>
                            </div>
                            {!collapsed && (expandedSections.admin ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                        </SectionToggle>
                        <SubMenu $expanded={!collapsed && expandedSections.admin}>
                            {navigation.admin.items.map(item => (
                                <NavItem key={item.path} to={item.path} end={item.path === '/admin'} $submenu $collapsed={collapsed}>
                                    <IconWrapper $small><item.icon size={18} /></IconWrapper>
                                    <Label $collapsed={collapsed}>{item.label}</Label>
                                </NavItem>
                            ))}
                        </SubMenu>
                    </>
                )}

                {(user?.role === 'admin' || user?.role === 'manager') && (
                    <>
                        <SectionToggle onClick={() => toggleSection('manager')} $collapsed={collapsed}>
                            <div className="flex-row">
                                <navigation.manager.icon size={16} className="section-icon" />
                                <Label $collapsed={collapsed}>{navigation.manager.label}</Label>
                            </div>
                            {!collapsed && (expandedSections.manager ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                        </SectionToggle>
                        <SubMenu $expanded={!collapsed && expandedSections.manager}>
                            {navigation.manager.items.map(item => (
                                <NavItem
                                    key={item.path}
                                    to={item.path}
                                    $submenu
                                    $collapsed={collapsed}
                                    data-tour={item.path === '/projects' ? 'sidebar-projects' : undefined}
                                >
                                    <IconWrapper $small><item.icon size={18} /></IconWrapper>
                                    <Label $collapsed={collapsed}>{item.label}</Label>
                                </NavItem>
                            ))}
                        </SubMenu>
                    </>
                )}

                <SectionToggle onClick={() => toggleSection('system')} $collapsed={collapsed}>
                    <div className="flex-row">
                        <navigation.system.icon size={16} className="section-icon" />
                        <Label $collapsed={collapsed}>{navigation.system.label}</Label>
                    </div>
                    {!collapsed && (expandedSections.system ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                </SectionToggle>
                <SubMenu $expanded={!collapsed && expandedSections.system}>
                    {navigation.system.items.map(item => (
                        <NavItem key={item.path} to={item.path} $submenu $collapsed={collapsed}>
                            <IconWrapper $small><item.icon size={18} /></IconWrapper>
                            <Label $collapsed={collapsed}>{item.label}</Label>
                        </NavItem>
                    ))}
                </SubMenu>

            </NavScroller>

            {/* Profile Footer */}
            <Footer>
                {/* Online Users Panel — admin & manager only */}
                {(user?.role === 'admin' || user?.role === 'manager') && (
                    <OnlineUsersPanel collapsed={collapsed} />
                )}

                {/* Recently Viewed */}
                {!collapsed && recentItems.length > 0 && (
                    <RecentSection>
                        <RecentHeader>
                            <History size={13} />
                            Recently Viewed
                        </RecentHeader>
                        {recentItems.map(item => (
                            <RecentItem key={item.path} onClick={() => navigate(item.path)}>
                                <RecentDot />
                                <RecentLabel>{item.label}</RecentLabel>
                                <RecentTime>{getRelativeTime(item.timestamp)}</RecentTime>
                            </RecentItem>
                        ))}
                    </RecentSection>
                )}

                <ThemeToggleBtn
                    onClick={toggleTheme}
                    $collapsed={collapsed}
                    title={themeMode === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
                    data-tour="theme-toggle"
                >
                    {themeMode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    <Label $collapsed={collapsed} style={{ marginLeft: 12 }}>{themeMode === 'light' ? 'Dark Mode' : 'Light Mode'}</Label>
                </ThemeToggleBtn>

                <ProfileCard $collapsed={collapsed}>
                    <Avatar>{user?.name?.charAt(0) || 'U'}</Avatar>
                    <UserInfo $collapsed={collapsed}>
                        <div className="name">{user?.name}</div>
                        <div className="role">{user?.role}</div>
                    </UserInfo>
                    <LogoutBtn onClick={handleLogout} title="Logout" $collapsed={collapsed}>
                        <LogOut size={18} />
                    </LogoutBtn>
                </ProfileCard>
            </Footer>
        </SidebarContainer>
    );
};

// --- Animations ---
const fadeIn = keyframes`
    from { opacity: 0; } to { opacity: 1; }
`;

// --- Styled Components ---

const SidebarContainer = styled.div`
    width: ${props => props.$collapsed ? '80px' : '260px'};
    height: 100vh;
    background: ${props => props.theme.bg.primary};
    border-right: 1px solid ${props => props.theme.border};
    display: flex;
    flex-direction: column;
    transition: width 0.3s cubic-bezier(0.2, 0, 0, 1), background-color 0.3s, border-color 0.3s;
    position: relative;
    z-index: 50;

    ${props => props.$mobile && css`
        position: fixed;
        left: 0; top: 0;
        transform: ${props.$collapsed ? 'translateX(-100%)' : 'translateX(0)'};
        width: 260px;
    `}
`;

const Header = styled.div`
    height: 80px;
    display: flex;
    align-items: center;
    padding: ${props => props.$collapsed ? '0 20px' : '0 20px'};
    position: relative;
    justify-content: ${props => props.$collapsed ? 'center' : 'flex-start'};
    border-bottom: 1px solid ${props => props.theme.border};
    background: ${props => props.theme.bg.primary};
    
    ${props => props.$collapsed && css`
        ${Brand} {
            justify-content: center;
        }
        ${LogoIcon} {
            margin: 0;
        }
    `}
`;

const SearchWrapper = styled.div`
    padding: 0 12px 12px;
    display: ${props => props.$collapsed ? 'none' : 'block'};
    opacity: ${props => props.$collapsed ? 0 : 1};
    transition: opacity 0.2s;
`;

const Brand = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    overflow: hidden;
    width: 100%;
`;

const LogoIcon = styled.div`
    width: 32px;
    height: 32px;
    background: #0F62FE; /* Carbon Blue 60 */
    border-radius: 0;
    display: flex; 
    align-items: center; 
    justify-content: center;
    flex-shrink: 0;
    z-index: 10;
    position: relative;
    transition: background 0.2s;

    &:hover {
        background: #0043ce;
    }

    svg {
        filter: none;
    }
`;

const BrandText = styled.div`
    font-size: 1.125rem;
    font-weight: 600; /* Carbon Semi-Bold */
    color: ${props => props.theme.text.primary};
    white-space: nowrap;
    visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
    opacity: ${props => props.$collapsed ? 0 : 1};
    width: ${props => props.$collapsed ? '0' : 'auto'};
    overflow: hidden;
    transition: opacity 0.2s, width 0.3s, color 0.3s;
    letter-spacing: 0;
    line-height: 1;
`;

// Floating Toggle Button
const ToggleBtn = styled.button`
    width: 24px; height: 24px;
    display: flex; align-items: center; justify-content: center;
    background: ${props => props.theme.bg.primary};
    border: 1px solid ${props => props.theme.border};
    border-radius: 50%;
    color: ${props => props.theme.text.secondary};
    cursor: pointer;
    transition: all 0.2s;

    position: absolute;
    right: -12px;
    top: 28px;
    z-index: 100;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    &:hover { background: ${props => props.theme.bg.hover}; color: #0F62FE; border-color: #0F62FE; }
`;

const NavScroller = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 20px 12px;
    
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: ${props => props.theme.border}; border-radius: 4px; }
`;

const SectionLabel = styled.div`
    font-size: 0.75rem;
    font-weight: 700;
    color: ${props => props.theme.text.tertiary};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 12px 12px;
    height: 20px;
    overflow: hidden;
    white-space: nowrap;
    opacity: ${props => props.$collapsed ? 0 : 1};
    transition: opacity 0.2s, color 0.3s;
`;

const SectionToggle = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 12px;
    margin-top: 8px;
    color: ${props => props.theme.text.tertiary};
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    border-radius: 0;
    transition: all 0.2s;

    &:hover { color: ${props => props.theme.text.primary}; }

    .flex-row { display: flex; align-items: center; gap: 12px; }
    .section-icon { flex-shrink: 0; }
    
    ${props => props.$collapsed && css`
        justify-content: center;
        .flex-row { gap: 0; }
    `}
`;

const SubMenu = styled.div`
    overflow: hidden;
    max-height: ${props => props.$expanded ? '500px' : '0'};
    opacity: ${props => props.$expanded ? 1 : 0};
    transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
    padding-left: 0; // Don't indent container, indent items
`;

const NavItem = styled(NavLink)`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    margin-bottom: 4px;
    border-radius: 0; /* Carbon brutalism */
    color: ${props => props.theme.text.secondary};
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9375rem;
    transition: all 0.2s;
    position: relative;
    justify-content: ${props => props.$collapsed ? 'center' : 'flex-start'};

    ${props => props.$submenu && css`
        padding-left: ${props.$collapsed ? '12px' : '28px'};
        font-size: 0.8125rem;
        font-weight: 400;
        &::before {
            content: '';
            position: absolute;
            left: 0; top: 0; bottom: 0; width: 4px;
            background: transparent;
            transition: background 0.2s;
        }
    `}

    &:hover {
        background: ${props => props.theme.bg.hover};
        color: ${props => props.theme.text.primary};
    }

    &.active {
        background: ${props => props.theme.mode === 'dark' ? '#262626' : '#E5E5E5'}; /* Carbon selected state */
        color: ${props => props.theme.text.primary};
        font-weight: 600;

        // Custom indicator for active state (Carbon style left-border instead of right)
        &::before {
            content: '';
            position: absolute;
            left: 0; top: 0; bottom: 0; width: 4px;
            background: #0F62FE; /* Carbon Blue 60 */
            border-radius: 0;
        }
        
        &::after {
            display: none; /* Hide old right border */
        }
    }
`;

const IconWrapper = styled.div`
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    width: 24px;
    ${props => props.$small && css`width: 20px;`}
`;

const Label = styled.span`
    white-space: nowrap;
    visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
    opacity: ${props => props.$collapsed ? 0 : 1};
    width: ${props => props.$collapsed ? '0' : 'auto'};
    overflow: hidden;
    transition: opacity 0.2s, width 0.3s, visibility 0.3s;
`;

const Tooltip = styled.div`
    position: absolute;
    left: 100%; top: 50%; transform: translateY(-50%);
    background: #1e293b;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    z-index: 100;
    transition: opacity 0.2s;
    margin-left: 8px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);

    ${NavItem}:hover & {
        opacity: 1;
    }
`;

const NotifBadge = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: #ef4444;
    color: white;
    border-radius: 999px;
    font-size: 0.62rem;
    font-weight: 800;
    line-height: 1;
    margin-left: auto;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
    visibility: ${p => p.$collapsed ? 'hidden' : 'visible'};
    opacity: ${p => p.$collapsed ? 0 : 1};
    transition: opacity 0.2s;
`;

const Divider = styled.div`
    height: 1px;
    background: ${props => props.theme.border};
    margin: 16px 12px;
`;

const Footer = styled.div`
    padding: 16px;
    border-top: 1px solid ${props => props.theme.border};
`;

const ProfileCard = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: ${props => props.theme.bg.hover};
    border-radius: 0;
    border: 1px solid ${props => props.theme.border};
    transition: all 0.2s;
    overflow: hidden;

    ${props => props.$collapsed && css`
        padding: 12px;
        justify-content: center;
        background: transparent;
        border-color: transparent;
        gap: 0;
    `}
`;

const Avatar = styled.div`
    width: 36px; height: 36px;
    border-radius: 50%;
    background: #0f172a;
    color: white;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700;
    flex-shrink: 0;
    font-size: 0.9375rem;
`;

const UserInfo = styled.div`
    flex: 1;
    overflow: hidden;
    visibility: ${props => props.$collapsed ? 'hidden' : 'visible'};
    opacity: ${props => props.$collapsed ? 0 : 1};
    width: ${props => props.$collapsed ? 0 : 'auto'};
    transition: width 0.3s, opacity 0.3s, visibility 0.3s;

    .name { font-size: 0.875rem; font-weight: 600; color: ${props => props.theme.text.primary}; white-space: nowrap; }
    .role { font-size: 0.75rem; color: ${props => props.theme.text.secondary}; text-transform: capitalize; }
`;

const LogoutBtn = styled.button`
    width: 32px; height: 32px;
    display: ${props => props.$collapsed ? 'none' : 'flex'};
    align-items: center;
    justify-content: center;
    background: ${props => props.theme.bg.primary};
    border: 1px solid ${props => props.theme.border};
    border-radius: 0;
    color: ${props => props.theme.text.secondary};
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover { background: ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2'}; color: #ef4444; border-color: ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.4)' : '#da1e28'}; }
`;

const ThemeToggleBtn = styled.button`
    display: flex;
    align-items: center;
    width: 100%;
    padding: 10px 12px;
    margin-bottom: 12px;
    background: transparent;
    border: none;
    border-radius: 0;
    cursor: pointer;
    color: ${props => props.theme.text.secondary};
    transition: all 0.2s;
    justify-content: ${props => props.$collapsed ? 'center' : 'flex-start'};

    &:hover {
        background: ${props => props.theme.bg.hover};
        color: ${props => props.theme.text.primary};
    }
`;

// ─── Recently Viewed ──────────────────────────────────────────────────────────

const getRelativeTime = (ts) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
};

const RecentSection = styled.div`
    border-top: 1px solid ${props => props.theme.border};
    padding: 10px 12px 8px;
    margin-bottom: 4px;
`;

const RecentHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: ${props => props.theme.text.tertiary};
    margin-bottom: 8px;
`;

const RecentItem = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 5px 6px;
    background: none;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;

    &:hover { background: ${props => props.theme.bg.hover}; }
`;

const RecentDot = styled.div`
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${props => props.theme.text.tertiary};
    flex-shrink: 0;
`;

const RecentLabel = styled.span`
    flex: 1;
    font-size: 12px;
    color: ${props => props.theme.text.secondary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const RecentTime = styled.span`
    font-size: 10px;
    color: ${props => props.theme.text.tertiary};
    white-space: nowrap;
`;

export default Sidebar;
