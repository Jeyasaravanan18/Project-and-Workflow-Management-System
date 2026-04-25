import { Bell, Search, ChevronDown, Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TopBar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="top-bar">
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Left: Greeting */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-100)', margin: 0 }}>
                        {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
                    </h2>
                </div>

                {/* Center: Search (Placeholder) */}
                <div style={{
                    flex: 1,
                    maxWidth: '400px',
                    margin: '0 var(--space-8)',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: 'var(--space-3)',
                                color: 'var(--slate-500)'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search projects, tasks..."
                            className="input"
                            style={{
                                paddingLeft: 'var(--space-10)',
                                fontSize: '0.875rem',
                                background: 'var(--slate-900)',
                                border: '1px solid var(--slate-800)'
                            }}
                            disabled
                        />
                    </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    {/* Notifications */}
                    <button
                        onClick={() => navigate('/notifications')}
                        style={{
                            position: 'relative',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 'var(--space-2)',
                            color: 'var(--slate-400)',
                            borderRadius: 'var(--radius-lg)',
                            transition: 'all var(--transition-base)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--slate-800)';
                            e.currentTarget.style.color = 'var(--slate-100)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--slate-400)';
                        }}
                    >
                        <Bell size={20} />
                    </button>

                    {/* Profile Dropdown */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-3)',
                                background: 'var(--slate-800)',
                                border: '1px solid var(--slate-700)',
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--space-2) var(--space-3)',
                                cursor: 'pointer',
                                transition: 'all var(--transition-base)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--slate-600)';
                                e.currentTarget.style.background = 'var(--slate-700)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--slate-700)';
                                e.currentTarget.style.background = 'var(--slate-800)';
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--gradient-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.875rem'
                            }}>
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--slate-200)' }}>
                                    {user?.name}
                                </span>
                                <span style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--slate-500)',
                                    textTransform: 'capitalize'
                                }}>
                                    {user?.role}
                                </span>
                            </div>
                            <ChevronDown size={16} style={{ color: 'var(--slate-400)' }} />
                        </button>

                        {/* Dropdown Menu */}
                        {showProfileMenu && (
                            <>
                                <div
                                    style={{
                                        position: 'fixed',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        zIndex: 'var(--z-dropdown)'
                                    }}
                                    onClick={() => setShowProfileMenu(false)}
                                />
                                <div
                                    className="animate-scale-in"
                                    style={{
                                        position: 'absolute',
                                        top: 'calc(100% + var(--space-2))',
                                        right: 0,
                                        background: 'var(--slate-800)',
                                        border: '1px solid var(--slate-700)',
                                        borderRadius: 'var(--radius-lg)',
                                        minWidth: '200px',
                                        boxShadow: 'var(--shadow-xl)',
                                        zIndex: 'calc(var(--z-dropdown) + 1)',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{
                                        padding: 'var(--space-3) var(--space-4)',
                                        borderBottom: '1px solid var(--slate-700)'
                                    }}>
                                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--slate-200)', margin: 0 }}>
                                            {user?.email}
                                        </p>
                                    </div>
                                    <div style={{ padding: 'var(--space-2)' }}>
                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                // Navigate to profile (if exists)
                                            }}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-3)',
                                                padding: 'var(--space-2) var(--space-3)',
                                                background: 'transparent',
                                                border: 'none',
                                                borderRadius: 'var(--radius-md)',
                                                color: 'var(--slate-300)',
                                                fontSize: '0.875rem',
                                                cursor: 'pointer',
                                                transition: 'all var(--transition-fast)',
                                                textAlign: 'left'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--slate-700)';
                                                e.currentTarget.style.color = 'var(--slate-100)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color = 'var(--slate-300)';
                                            }}
                                        >
                                            <User size={16} />
                                            Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                logout();
                                            }}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-3)',
                                                padding: 'var(--space-2) var(--space-3)',
                                                background: 'transparent',
                                                border: 'none',
                                                borderRadius: 'var(--radius-md)',
                                                color: 'var(--danger-400)',
                                                fontSize: '0.875rem',
                                                cursor: 'pointer',
                                                transition: 'all var(--transition-fast)',
                                                textAlign: 'left'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
