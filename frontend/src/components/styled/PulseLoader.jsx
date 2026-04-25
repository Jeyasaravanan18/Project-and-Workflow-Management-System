import React from 'react';
import styled, { keyframes } from 'styled-components';

const PulseLoader = ({ size = 'md', color = 'primary' }) => {
    return (
        <LoaderContainer $size={size}>
            <Pulse $color={color} $delay={0} />
            <Pulse $color={color} $delay={0.15} />
            <Pulse $color={color} $delay={0.3} />
        </LoaderContainer>
    );
};

const pulse = keyframes`
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
`;

const LoaderContainer = styled.div`
  display: flex;
  gap: ${props => props.$size === 'sm' ? '8px' : props.$size === 'lg' ? '16px' : '12px'};
  align-items: center;
  justify-content: center;
`;

const Pulse = styled.div`
  width: ${props => props.$size === 'sm' ? '8px' : props.$size === 'lg' ? '16px' : '12px'};
  height: ${props => props.$size === 'sm' ? '8px' : props.$size === 'lg' ? '16px' : '12px'};
  border-radius: 50%;
  animation: ${pulse} 1.4s ease-in-out infinite;
  animation-delay: ${props => props.$delay}s;

  ${props => {
        const colors = {
            primary: '#6366f1',
            success: '#22c55e',
            danger: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        const color = colors[props.$color] || colors.primary;
        return `
      background: ${color};
      box-shadow: 0 0 20px ${color}80;
    `;
    }}
`;

export default PulseLoader;
