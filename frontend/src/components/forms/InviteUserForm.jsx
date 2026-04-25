import { useState } from 'react';
import api from '../../services/api';

const InviteUserForm = ({ onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'member'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await api.post('/users/invite', formData);
            setSuccess(`Invitation email sent to ${formData.email}`);
            setTimeout(() => {
                onSuccess();
            }, 2000);
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || 'Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {error && (
                <div style={{
                    padding: 'var(--space-3)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--danger-400)',
                    fontSize: '0.875rem'
                }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{
                    padding: 'var(--space-3)',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--success-400)',
                    fontSize: '0.875rem'
                }}>
                    ✅ {success}
                </div>
            )}

            <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                    type="text"
                    required
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                />
            </div>

            <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                    type="email"
                    required
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                />
                <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--slate-500)',
                    margin: 0,
                    marginTop: 'var(--space-1)'
                }}>
                    An invitation email will be sent to this address
                </p>
            </div>

            <div className="input-group">
                <label className="input-label">Role</label>
                <select
                    className="select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                >
                    <option value="member">Member - Can view and update assigned tasks</option>
                    <option value="manager">Manager - Can manage projects and teams</option>
                </select>
                <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--slate-500)',
                    margin: 0,
                    marginTop: 'var(--space-1)'
                }}>
                    Note: Admin role can only be assigned during organization creation
                </p>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--space-3)',
                paddingTop: 'var(--space-4)',
                borderTop: '1px solid var(--slate-700)'
            }}>
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn btn-ghost"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                >
                    {loading ? 'Sending Invitation...' : 'Send Invitation'}
                </button>
            </div>
        </form>
    );
};

export default InviteUserForm;
