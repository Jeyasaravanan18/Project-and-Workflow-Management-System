import React from 'react';
import styled, { keyframes } from 'styled-components';

const AnimatedButton = ({ children, onClick, variant = 'primary', size = 'md', fullWidth = false, disabled }) => {
  return (
    <StyledButton onClick={onClick} $variant={variant} $size={size} $fullWidth={fullWidth} disabled={disabled}>
      <span>{children}</span>
    </StyledButton>
  );
};

const StyledButton = styled.button`
  /* SOLID COLORS - NO BLUE, NO GREEN (except success) */
    /* SOLID COLORS - NO BLUE, NO GREEN (except success) */
    ${props => props.$variant === 'primary' && `
      background: #0F62FE; /* Carbon Blue */
      &:hover:not(:disabled) {
        background: #0043CE; /* Carbon Blue Hover */
      }
    `}

    ${props => props.$variant === 'success' && `
      background: #24A148; /* Carbon Green */
      &:hover:not(:disabled) {
        background: #198038; /* Carbon Green Hover */
      }
    `}

    ${props => props.$variant === 'danger' && `
      background: #DA1E28; /* Carbon Red */
      &:hover:not(:disabled) {
        background: #A2191F; /* Carbon Red Hover */
      }
    `}

    ${props => props.$variant === 'secondary' && `
      background: #393939; /* Carbon Gray 80 */
      &:hover:not(:disabled) {
        background: #525252; /* Carbon Gray 70 */
      }
    `}

    ${props => props.$variant === 'accent' && `
      background: #8A3FFC; /* Carbon Purple */
      &:hover:not(:disabled) {
        background: #6929C4; /* Carbon Purple Hover */
      }
    `}

  -webkit-tap-highlight-color: transparent;
  -webkit-appearance: none;
  outline: none;
  position: relative;
  cursor: pointer;
  border: none;
  display: ${props => props.$fullWidth ? 'block' : 'inline-flex'};
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
  border-radius: 0; /* Carbon */
  padding: ${props => props.$size === 'sm' ? '8px 16px' : props.$size === 'lg' ? '14px 28px' : '10px 20px'};
  margin: 0;
  text-align: center;
  font-weight: 600;
  font-size: ${props => props.$size === 'sm' ? '14px' : props.$size === 'lg' ? '16px' : '15px'};
  letter-spacing: 0.01em;
  line-height: 1.5;
  color: white;
  box-shadow: none; /* Carbon */
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    /* Carbon uses pure color shifts for hover, no translation/shadows on buttons */
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  span {
    display: inline-block;
    position: relative;
    z-index: 1;
  }
`;

export default AnimatedButton;
