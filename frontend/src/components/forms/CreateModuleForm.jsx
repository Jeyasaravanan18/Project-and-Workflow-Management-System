import { useState } from 'react';
import api from '../../services/api';
import styled, { keyframes } from 'styled-components';
import { Layers, FileText, Clock, Loader2, Check } from 'lucide-react';

const CreateModuleForm = ({ projectId, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        estimatedHours: 0
    });
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            const ownerId = userData._id;

            await api.post('/modules', {
                ...formData,
                projectId,
                ownerId
            });
            onSuccess();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to create module');
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormContainer onSubmit={handleSubmit}>
            <FormGroup $delay={0.1}>
                <Label $active={focusedField === 'name'}>
                    <Layers size={16} />
                    Module Name
                </Label>
                <InputWrapper $focus={focusedField === 'name'}>
                    <StyledInput
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="e.g. Authentication Service"
                        autoFocus
                    />
                </InputWrapper>
            </FormGroup>

            <FormGroup $delay={0.2}>
                <Label $active={focusedField === 'description'}>
                    <FileText size={16} />
                    Description
                </Label>
                <InputWrapper $focus={focusedField === 'description'}>
                    <StyledTextArea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        onFocus={() => setFocusedField('description')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Briefly describe the module's purpose..."
                        rows={3}
                    />
                </InputWrapper>
            </FormGroup>

            <FormGroup $delay={0.3}>
                <Label $active={focusedField === 'estimatedHours'}>
                    <Clock size={16} />
                    Est. Hours
                </Label>
                <InputWrapper $focus={focusedField === 'estimatedHours'}>
                    <StyledInput
                        type="number"
                        min="0"
                        value={formData.estimatedHours}
                        onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                        onFocus={() => setFocusedField('estimatedHours')}
                        onBlur={() => setFocusedField(null)}
                    />
                    <Suffix>hours</Suffix>
                </InputWrapper>
            </FormGroup>

            <Actions $delay={0.4}>
                <CancelButton type="button" onClick={onCancel}>
                    Cancel
                </CancelButton>
                <SubmitButton type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Check size={18} />
                            Add Module
                        </>
                    )}
                </SubmitButton>
            </Actions>
        </FormContainer>
    );
};

// Animations
const slideUp = keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const FormContainer = styled.form`
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 8px 0;
`;

const FormGroup = styled.div`
    opacity: 0;
    animation: ${slideUp} 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: ${props => props.$delay}s;
`;

const Label = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${props => props.$active ? '#f97316' : '#64748b'};
    margin-bottom: 8px;
    transition: color 0.2s ease;
`;

const InputWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    background: #f8fafc;
    border: 2px solid ${props => props.$focus ? '#f97316' : 'transparent'};
    border-radius: 12px;
    transition: all 0.2s ease;
    box-shadow: ${props => props.$focus ? '0 0 0 4px rgba(249, 115, 22, 0.1)' : 'none'};
    overflow: hidden;

    &:hover {
        background: #f1f5f9;
        ${props => !props.$focus && `border-color: #cbd5e1;`}
    }
`;

const StyledInput = styled.input`
    width: 100%;
    padding: 12px 16px;
    background: transparent;
    border: none;
    font-size: 0.9375rem;
    color: #0f172a;
    outline: none;

    &::placeholder {
        color: #94a3b8;
    }
`;

const StyledTextArea = styled.textarea`
    width: 100%;
    padding: 12px 16px;
    background: transparent;
    border: none;
    font-size: 0.9375rem;
    color: #0f172a;
    outline: none;
    resize: none;
    font-family: inherit;

    &::placeholder {
        color: #94a3b8;
    }
`;

const Suffix = styled.span`
    padding-right: 16px;
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 500;
    pointer-events: none;
`;

const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 8px;
    opacity: 0;
    animation: ${slideUp} 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: ${props => props.$delay}s;
`;

const ButtonBase = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 24px;
    border-radius: 12px;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
`;

const CancelButton = styled(ButtonBase)`
    background: transparent;
    color: #64748b;
    border: 1px solid transparent;

    &:hover {
        background: #f1f5f9;
        color: #0f172a;
    }
`;

const SubmitButton = styled(ButtonBase)`
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    color: white;
    border: none;
    box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.3);

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 12px -1px rgba(249, 115, 22, 0.4);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
`;

export default CreateModuleForm;
