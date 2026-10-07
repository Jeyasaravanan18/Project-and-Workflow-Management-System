import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import styled, { keyframes } from "styled-components";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !email.trim()) {
            setError("Email is required");
            return;
        }
        if (!password) {
            setError("Password is required");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError("Please provide a valid email address");
            return;
        }

        setLoading(true);
        try {
            const user = await login(email.trim(), password);
            if (user.role === "admin") navigate("/admin");
            else if (user.role === "manager") navigate("/projects");
            else navigate("/my-work");
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
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
                                <LogIn size={32} />
                            </LogoIcon>
                            <LogoText>ProjectFlow</LogoText>
                        </LogoWrapper>
                        
                        <BrandHero>
                            <HeroTitle>Enterprise Intelligence. <br/>Simplified Workflow.</HeroTitle>
                        </BrandHero>

                        <BrandFooter>

                            <Copyright>© 2026 ProjectFlow — Enterprise Tier</Copyright>
                        </BrandFooter>
                    </BrandContent>
                </BrandSide>

                {/* Form Section */}
                <FormSide>
                    <FormWrapper>
                        <HeaderSection>
                            <Title>Log in</Title>
                            <Subtitle>Don't have an account? <TextLink to="/register">Create an organization</TextLink></Subtitle>
                        </HeaderSection>

                        {error && (
                            <ErrorContainer>
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </ErrorContainer>
                        )}

                        <LoginForm onSubmit={handleSubmit}>
                            <FormGroup>
                                <Label htmlFor="email">Email address</Label>
                                <InputWrapper>
                                    <StyledInput
                                        id="email"
                                        type="email"
                                        placeholder="e.g. user@enterprise.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <InputIcon><Mail size={18} /></InputIcon>
                                </InputWrapper>
                            </FormGroup>

                            <FormGroup>
                                <Label htmlFor="password">Password</Label>
                                <InputWrapper>
                                    <StyledInput
                                        id="password"
                                        type="password"
                                        placeholder="Enter your security credential"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <InputIcon><Lock size={18} /></InputIcon>
                                </InputWrapper>
                                <ForgotPasswordLink to="/forgot-password">Forgot password?</ForgotPasswordLink>
                            </FormGroup>

                            <PrimaryButton type="submit" disabled={loading}>
                                {loading ? "Authenticating..." : "Continue"}
                                <ArrowRight size={18} />
                            </PrimaryButton>
                        </LoginForm>
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
    background: radial-gradient(circle at 0% 0%, rgba(15, 98, 254, 0.15) 0%, transparent 50%);
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
    margin: 64px 0;
    animation: ${fadeIn} 0.6s cubic-bezier(0.2, 0, 0.38, 0.9);
`;

const HeroTitle = styled.h1`
    font-size: 3.5rem;
    font-weight: 300;
    line-height: 1.1;
    margin-bottom: 24px;
    letter-spacing: -1px;
    color: #ffffff;

    @media (max-width: 1280px) {
        font-size: 2.75rem;
    }
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
    max-width: 400px;
    animation: ${fadeIn} 0.4s cubic-bezier(0.2, 0, 0.38, 0.9) 0.2s backwards;
`;

const HeaderSection = styled.div`
    margin-bottom: 40px;
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

const LoginForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 24px;
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

const ForgotPasswordLink = styled(Link)`
    color: #0f62fe;
    font-size: 0.75rem;
    text-decoration: none;
    align-self: flex-end;
    margin-top: 4px;
    &:hover { text-decoration: underline; }
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
    margin-top: 16px;

    &:hover {
        background: #0043ce;
    }

    &:disabled {
        background: #c6c6c6;
        cursor: not-allowed;
    }
`;

export default Login;
