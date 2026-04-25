import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import styled, { keyframes } from 'styled-components';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        organizationName: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!formData.organizationName.trim()) {
            setError("Organization name is required");
            return;
        }

        setLoading(true);
        try {
            await register(formData);
            navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <PageContainer>
            <SplitLayout>
                {/* Visual Branding Section */}
                <BrandSide>
                    <BrandOverlay />
                    <BrandContent>
                        <LogoWrapper>
                            <LogoIcon>
                                <Building2 size={32} />
                            </LogoIcon>
                            <LogoText>Quantos</LogoText>
                        </LogoWrapper>
                        
                        <BrandHero>
                            <HeroTitle>Launch Your <br/>Digital Workspace.</HeroTitle>
                        </BrandHero>



                        <BrandFooter>

                            <Copyright>© 2026 Quantos</Copyright>
                        </BrandFooter>
                    </BrandContent>
                </BrandSide>

                {/* Registration Form Section */}
                <FormSide>
                    <FormWrapper>
                        <HeaderSection>
                            <Title>Get started</Title>
                            <Subtitle>Already have an account? <TextLink to="/login">Sign in</TextLink></Subtitle>
                        </HeaderSection>

                        {error && (
                            <ErrorContainer>
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </ErrorContainer>
                        )}

                        <RegistrationForm onSubmit={handleSubmit}>
                            <FormGroup>
                                <Label htmlFor="organizationName">Organization name</Label>
                                <InputWrapper>
                                    <StyledInput
                                        id="organizationName"
                                        name="organizationName"
                                        type="text"
                                        placeholder="e.g. Acme Corporation"
                                        value={formData.organizationName}
                                        onChange={handleChange}
                                        required
                                    />
                                    <InputIcon><Building2 size={18} /></InputIcon>
                                </InputWrapper>
                            </FormGroup>

                            <FormGroup>
                                <Label htmlFor="name">Full name</Label>
                                <InputWrapper>
                                    <StyledInput
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="e.g. Jane Doe"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                    <InputIcon><User size={18} /></InputIcon>
                                </InputWrapper>
                            </FormGroup>

                            <FormGroup>
                                <Label htmlFor="email">Work email</Label>
                                <InputWrapper>
                                    <StyledInput
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="user@company.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    <InputIcon><Mail size={18} /></InputIcon>
                                </InputWrapper>
                            </FormGroup>

                            <FormGroup>
                                <Label htmlFor="password">Security credential</Label>
                                <InputWrapper>
                                    <StyledInput
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="Create a strong password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                    />
                                    <InputIcon><Lock size={18} /></InputIcon>
                                </InputWrapper>
                                <HintText>Minimum 6 characters required</HintText>
                            </FormGroup>

                            <PrimaryButton type="submit" disabled={loading}>
                                {loading ? "Creating Account..." : "Create Organization"}
                                <ArrowRight size={18} />
                            </PrimaryButton>
                        </RegistrationForm>

                        <LegalDisclaimer>
                            By creating an account, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                        </LegalDisclaimer>
                    </FormWrapper>
                </FormSide>
            </SplitLayout>
        </PageContainer>
    );
};

// --- Styled Components ---

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
    min-height: 100vh;
    width: 100%;
    background: #ffffff;
    font-family: 'IBM Plex Sans', sans-serif;
`;

const SplitLayout = styled.div`
    display: flex;
    min-height: 100vh;
    @media (max-width: 1024px) {
        flex-direction: column;
    }
`;

const BrandSide = styled.div`
    flex: 0 0 45%;
    position: relative;
    background: #161616; /* Carbon Gray 100 */
    color: white;
    display: flex;
    padding: 64px;
    overflow: hidden;

    @media (max-width: 1024px) {
        flex: none;
        padding: 40px;
    }
`;

const BrandOverlay = styled.div`
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at 100% 100%, rgba(15, 98, 254, 0.15) 0%, transparent 50%);
    pointer-events: none;
`;

const BrandContent = styled.div`
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
`;

const LogoWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const LogoIcon = styled.div`
    width: 48px;
    height: 48px;
    background: #0f62fe;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const LogoText = styled.h2`
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: -0.5px;
    margin: 0;
    color: #ffffff;
    span { color: #0f62fe; }
`;

const BrandHero = styled.div`
    margin: 48px 0;
    animation: ${fadeIn} 0.6s cubic-bezier(0.2, 0, 0.38, 0.9);
`;

const HeroTitle = styled.h1`
    font-size: 3.5rem;
    font-weight: 300;
    line-height: 1.1;
    margin-bottom: 24px;
    letter-spacing: -1px;
    color: #ffffff;
`;





const BrandFooter = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #8d8d8d;
    font-size: 0.8125rem;
`;



const Copyright = styled.div``;

const FormSide = styled.div`
    flex: 1;
    background: #f4f4f4; /* Carbon Gray 10 */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 64px;

    @media (max-width: 640px) {
        padding: 32px;
    }
`;

const FormWrapper = styled.div`
    width: 100%;
    max-width: 440px;
    animation: ${fadeIn} 0.4s cubic-bezier(0.2, 0, 0.38, 0.9) 0.2s backwards;
`;

const HeaderSection = styled.div`
    margin-bottom: 32px;
`;

const Title = styled.h2`
    font-size: 2rem;
    font-weight: 400;
    color: #161616;
    margin: 0 0 8px;
`;

const Subtitle = styled.p`
    font-size: 0.875rem;
    color: #525252;
    margin: 0;
`;

const TextLink = styled(Link)`
    color: #0f62fe;
    text-decoration: none;
    font-weight: 400;
    &:hover { text-decoration: underline; }
`;

const ErrorContainer = styled.div`
    background: #fff;
    border-left: 4px solid #da1e28;
    padding: 12px 16px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: #161616;
    font-size: 0.8125rem;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    
    svg { color: #da1e28; }
`;

const RegistrationForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const Label = styled.label`
    font-size: 0.75rem;
    color: #525252;
    font-weight: 600;
`;

const InputWrapper = styled.div`
    position: relative;
    width: 100%;
`;

const StyledInput = styled.input`
    width: 100%;
    height: 48px;
    background: white;
    border: none;
    border-bottom: 1px solid #8d8d8d;
    padding: 0 48px 0 16px;
    font-size: 0.875rem;
    color: #161616;
    transition: all 0.2s;

    &:focus {
        outline: 2px solid #0f62fe;
        outline-offset: -2px;
    }

    &::placeholder {
        color: #a8a8a8;
    }
`;

const InputIcon = styled.div`
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #8d8d8d;
    pointer-events: none;
`;

const HintText = styled.p`
    font-size: 0.75rem;
    color: #8d8d8d;
    margin: 0;
`;

const PrimaryButton = styled.button`
    height: 48px;
    background: #0f62fe;
    color: white;
    border: none;
    padding: 0 48px 0 16px;
    font-size: 0.875rem;
    font-weight: 400;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: background 0.2s;
    margin-top: 12px;

    &:hover {
        background: #0043ce;
    }

    &:disabled {
        background: #c6c6c6;
        cursor: not-allowed;
    }
`;

const LegalDisclaimer = styled.p`
    margin-top: 24px;
    font-size: 0.75rem;
    color: #8d8d8d;
    text-align: center;
    line-height: 1.4;

    a { color: #0f62fe; text-decoration: none; &:hover { text-decoration: underline; } }
`;

export default Register;

