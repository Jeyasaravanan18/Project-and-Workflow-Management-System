import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Building2, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const AcceptInvitation = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [error, setError] = useState('');
    const [invitationData, setInvitationData] = useState(null);
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });

    // Validate token on mount (optional - you can skip this and just try to submit)
    useEffect(() => {
        console.log('🔑 Token extracted from URL:', token);
        console.log('   Token length:', token?.length);
        // For simplicity, we'll just set validating to false
        // In production, you might want to verify the token first
        setValidating(false);
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
        if (!passwordRegex.test(formData.password)) {
            setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
            return;
        }

        setLoading(true);
        try {
            console.log('📤 Sending accept invitation request:', {
                token,
                tokenLength: token?.length,
                hasPassword: !!formData.password
            });

            const response = await api.post('/auth/accept-invitation', {
                token,
                password: formData.password
            });

            console.log('✅ Accept invitation response received:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });

            // Validate response data
            if (!response.data || !response.data.data) {
                console.error('❌ Invalid response structure:', response.data);
                throw new Error('Invalid response from server');
            }

            const { user, accessToken } = response.data.data;

            console.log('👤 User data:', {
                id: user._id,
                email: user.email,
                role: user.role,
                hasToken: !!accessToken
            });

            // Combine user and token for storage
            const userWithToken = {
                ...user,
                accessToken
            };

            // Auto-login
            setUser(userWithToken);
            localStorage.setItem('user', JSON.stringify(userWithToken));

            console.log('🔐 User authenticated, redirecting to dashboard...');

            // Redirect based on role
            if (user.role === 'admin') {
                navigate('/admin');
            } else if (user.role === 'manager') {
                navigate('/projects');
            } else {
                navigate('/my-work');
            }
        } catch (err) {
            console.error('❌ Accept invitation error:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                fullError: err
            });
            setError(err.response?.data?.message || 'Failed to accept invitation');
        } finally {
            setLoading(false);
        }
    };

    if (validating) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, var(--slate-950) 0%, var(--slate-900) 100%)'
            }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, var(--slate-950) 0%, var(--slate-900) 100%)',
            padding: 'var(--space-4)'
        }}>
            <div style={{
                maxWidth: '480px',
                width: '100%',
                background: 'linear-gradient(135deg, var(--slate-900) 0%, var(--slate-800) 100%)',
                borderRadius: 'var(--radius-2xl)',
                border: '1px solid var(--slate-700)',
                boxShadow: 'var(--shadow-2xl)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    background: 'var(--gradient-primary)',
                    padding: 'var(--space-8)',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: '200px',
                        height: '200px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius-full)',
                        filter: 'blur(60px)'
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <Building2 size={48} style={{ color: 'white', margin: '0 auto var(--space-4)' }} />
                        <h1 style={{
                            fontSize: '1.875rem',
                            fontWeight: 700,
                            color: 'white',
                            marginBottom: 'var(--space-2)'
                        }}>
                            Welcome Aboard!
                        </h1>
                        <p style={{
                            fontSize: '1rem',
                            color: 'rgba(255, 255, 255, 0.9)'
                        }}>
                            Set your password to get started
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div style={{ padding: 'var(--space-8)' }}>
                    {error && (
                        <div className="animate-slide-down" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-3)',
                            marginBottom: 'var(--space-6)',
                            fontSize: '0.875rem',
                            color: 'var(--danger-400)'
                        }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                        <div className="input-group">
                            <label className="input-label">
                                <Lock size={14} style={{ display: 'inline', marginRight: 'var(--space-2)' }} />
                                Create Password
                            </label>
                            <input
                                type="password"
                                className="input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                                required
                                minLength={8}
                            />
                            <p style={{
                                fontSize: '0.75rem',
                                color: 'var(--slate-500)',
                                margin: 0,
                                marginTop: 'var(--space-1)'
                            }}>
                                Must be at least 8 characters with uppercase, lowercase, and number
                            </p>
                        </div>

                        <div className="input-group">
                            <label className="input-label">
                                <Lock size={14} style={{ display: 'inline', marginRight: 'var(--space-2)' }} />
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                className="input"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="••••••••"
                                required
                                minLength={8}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={loading}
                            style={{ width: '100%' }}
                        >
                            {loading ? (
                                <div className="spinner" style={{ margin: '0 auto' }}></div>
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    Create Account & Sign In
                                </>
                            )}
                        </button>
                    </form>

                    <div style={{
                        marginTop: 'var(--space-6)',
                        padding: 'var(--space-3)',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        color: 'var(--slate-400)',
                        textAlign: 'center'
                    }}>
                        <strong style={{ color: 'var(--primary-400)' }}>Secure:</strong> Your password is encrypted and stored securely.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcceptInvitation;
