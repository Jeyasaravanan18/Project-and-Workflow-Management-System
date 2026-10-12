import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styled from 'styled-components';
import axios from 'axios';

const Profile = () => {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        bio: user?.bio || '',
        avatar: user?.avatar || '',
        preferences: {
            theme: user?.preferences?.theme || 'light',
            notifications: user?.preferences?.notifications || { email: true, push: true, inApp: true }, // Ensure object default
            language: user?.preferences?.language || 'en'
        }
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(
                '/api/users/profile',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage('Profile updated successfully!');
            setUser(response.data.data);

            // Update localStorage
            const storedUser = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('user', JSON.stringify({ ...storedUser, ...response.data.data }));
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                '/api/password/change',
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err.response?.data?.error?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, avatar: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Container>
            <Header>
                <Title>Profile Settings</Title>
                <Subtitle>Manage your account settings and preferences</Subtitle>
            </Header>

            {message && <SuccessMessage>{message}</SuccessMessage>}
            {error && <ErrorMessage>{error}</ErrorMessage>}

            <Content>
                <Section>
                    <SectionTitle>Personal Information</SectionTitle>
                    <Form onSubmit={handleProfileUpdate}>
                        <AvatarSection>
                            <Avatar src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.name}&size=128`} />
                            <AvatarUpload>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    id="avatar-upload"
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="avatar-upload">
                                    <UploadButton as="span">Change Avatar</UploadButton>
                                </label>
                            </AvatarUpload>
                        </AvatarSection>

                        <FormRow>
                            <FormGroup>
                                <Label>Full Name</Label>
                                <Input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </FormGroup>

                            <FormGroup>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    title="Email cannot be changed"
                                />
                            </FormGroup>
                        </FormRow>

                        <FormGroup>
                            <Label>Bio</Label>
                            <TextArea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Tell us about yourself..."
                                rows={4}
                                maxLength={500}
                            />
                            <CharCount>{formData.bio.length}/500</CharCount>
                        </FormGroup>

                        <FormGroup>
                            <Label>Role</Label>
                            <RoleBadge role={user?.role}>{user?.role?.toUpperCase()}</RoleBadge>
                        </FormGroup>

                        <SaveButton type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </SaveButton>
                    </Form>
                </Section>

                <Section>
                    <SectionTitle>Preferences</SectionTitle>
                    <PreferencesGrid>
                        <PreferenceItem>
                            <Label>Theme</Label>
                            <Select
                                value={formData.preferences.theme}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    preferences: { ...formData.preferences, theme: e.target.value }
                                })}
                            >
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                                <option value="auto">Auto</option>
                            </Select>
                        </PreferenceItem>

                        <PreferenceItem>
                            <Label>Language</Label>
                            <Select
                                value={formData.preferences.language}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    preferences: { ...formData.preferences, language: e.target.value }
                                })}
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                            </Select>
                        </PreferenceItem>

                        <PreferenceItem>
                            <CheckboxLabel>
                                <input
                                    type="checkbox"
                                    checked={formData.preferences.notifications?.email ?? true} // Access nested email property
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        preferences: {
                                            ...formData.preferences,
                                            notifications: {
                                                ...formData.preferences.notifications,
                                                email: e.target.checked
                                            }
                                        }
                                    })}
                                />
                                <span>Enable email notifications</span>
                            </CheckboxLabel>
                        </PreferenceItem>
                    </PreferencesGrid>
                </Section>

                <Section>
                    <SectionTitle>Change Password</SectionTitle>
                    <Form onSubmit={handlePasswordChange}>
                        <FormGroup>
                            <Label>Current Password</Label>
                            <Input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>New Password</Label>
                            <Input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                                minLength={8}
                            />
                            <Hint>Must be at least 8 characters with uppercase, lowercase, and number</Hint>
                        </FormGroup>

                        <FormGroup>
                            <Label>Confirm New Password</Label>
                            <Input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                            />
                        </FormGroup>

                        <SaveButton type="submit" disabled={loading}>
                            {loading ? 'Changing...' : 'Change Password'}
                        </SaveButton>
                    </Form>
                </Section>
            </Content>
        </Container>
    );
};

// Styled Components
const Container = styled.div`
    padding: 8px 0 40px 0;
    max-width: 1000px;
    margin: 0 auto;
`;

const Header = styled.div`
    margin-bottom: 28px;
`;

const Title = styled.h1`
    font-size: 1.85rem;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.02em;
    margin: 0 0 6px;
`;

const Subtitle = styled.p`
    font-size: 0.9rem;
    color: #6b7280;
    margin: 0;
`;

const Content = styled.div`
    display: grid;
    gap: 24px;
`;

const Section = styled.div`
    background: #ffffff;
    border-radius: 14px;
    padding: 28px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
`;

const SectionTitle = styled.h2`
    font-size: 1.1rem;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.01em;
    margin: 0 0 20px;
`;

const Form = styled.form``;

const AvatarSection = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid #f1f5f9;
`;

const Avatar = styled.img`
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e5e7eb;
`;

const AvatarUpload = styled.div``;

const UploadButton = styled.button`
    padding: 8px 18px;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
    }
`;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const FormGroup = styled.div`
    margin-bottom: 16px;
`;

const Label = styled.label`
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
`;

const Input = styled.input`
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    background: #f8fafc;
    color: #111827;
    transition: all 0.2s;

    &:focus {
        outline: none;
        background: #ffffff;
        border-color: #1E40AF;
        box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.12);
    }

    &:disabled {
        background: #f1f5f9;
        cursor: not-allowed;
    }
`;

const TextArea = styled.textarea`
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    background: #f8fafc;
    color: #111827;
    font-family: inherit;
    resize: vertical;
    transition: all 0.2s;

    &:focus {
        outline: none;
        background: #ffffff;
        border-color: #1E40AF;
        box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.12);
    }
`;

const CharCount = styled.div`
    font-size: 12px;
    color: #9ca3af;
    text-align: right;
    margin-top: 4px;
`;

const Select = styled.select`
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    background: #f8fafc;
    color: #111827;
    cursor: pointer;
    transition: all 0.2s;

    &:focus {
        outline: none;
        background: #ffffff;
        border-color: #1E40AF;
        box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.12);
    }
`;

const Hint = styled.p`
    font-size: 12px;
    color: #9ca3af;
    margin: 4px 0 0;
`;

const RoleBadge = styled.span`
    display: inline-block;
    padding: 4px 12px;
    background: ${props =>
        props.role === 'admin' ? '#EFF6FF' :
            props.role === 'manager' ? '#fffbeb' : '#f1f5f9'
    };
    color: ${props =>
        props.role === 'admin' ? '#1E40AF' :
            props.role === 'manager' ? '#b45309' : '#4b5563'
    };
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
`;

const PreferencesGrid = styled.div`
    display: grid;
    gap: 16px;
`;

const PreferenceItem = styled.div``;

const CheckboxLabel = styled.label`
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;

    input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: #1E40AF;
        cursor: pointer;
    }

    span {
        font-size: 14px;
        color: #374151;
    }
`;

const SaveButton = styled.button`
    padding: 10px 22px;
    background: #111827;
    color: white;
    border: none;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
        background: #1E40AF;
        transform: translateY(-1px);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const SuccessMessage = styled.div`
    padding: 12px 18px;
    background: #EFF6FF;
    border: 1px solid #a7f3d0;
    border-radius: 12px;
    color: #065f46;
    font-size: 14px;
    margin-bottom: 20px;
`;

const ErrorMessage = styled.div`
    padding: 12px 18px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 12px;
    color: #991b1b;
    font-size: 14px;
    margin-bottom: 20px;
`;

export default Profile;
