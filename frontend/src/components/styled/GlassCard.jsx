import React from 'react';
import styled from 'styled-components';

const GlassCard = ({ children, className, hover = true, glow = false }) => {
  return (
    <StyledCard className={className} $hover={hover} $glow={glow}>
      {children}
    </StyledCard>
  );
};

const StyledCard = styled.div`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(99, 102, 241, 0.3),
      transparent
    );
  }

  ${props => props.$hover && `
    &:hover {
      transform: translateY(-4px);
      border-color: rgba(99, 102, 241, 0.5);
      box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.08),
        0 0 40px rgba(99, 102, 241, 0.15);
      
      &:after {
        opacity: 1;
      }
    }
  `}

  ${props => props.$glow && `
    box-shadow: 
      0 0 20px rgba(99, 102, 241, 0.15),
      0 8px 32px rgba(0, 0, 0, 0.06);
  `}

  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(99, 102, 241, 0.08),
      transparent
    );
    transition: left 0.6s ease;
    opacity: 0;
  }
`;

export default GlassCard;
