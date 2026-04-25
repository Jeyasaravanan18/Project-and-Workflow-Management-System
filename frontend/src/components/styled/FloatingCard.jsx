import React from 'react';
import styled, { keyframes } from 'styled-components';

const FloatingCard = ({ children, delay = 0, className }) => {
    return (
        <Card $delay={delay} className={className}>
            <CardInner>
                {children}
            </CardInner>
            <CardGlow />
        </Card>
    );
};

const float = keyframes`
  0%, 100% {
    transform: translateY(0px) rotateX(0deg);
  }
  50% {
    transform: translateY(-20px) rotateX(5deg);
  }
`;

const glow = keyframes`
  0%, 100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.4;
  }
`;

const Card = styled.div`
  position: relative;
  perspective: 1000px;
  animation: ${float} 6s ease-in-out infinite;
  animation-delay: ${props => props.$delay}s;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.02) translateZ(20px);
    animation-play-state: paused;

    ${props => `
      & > div:first-child {
        transform: rotateX(5deg) rotateY(5deg);
        box-shadow: 
          0 30px 60px rgba(0, 0, 0, 0.4),
          0 0 50px rgba(99, 102, 241, 0.3);
      }
    `}
  }
`;

const CardInner = styled.div`
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.9) 0%,
    rgba(30, 41, 59, 0.7) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  padding: 32px;
  transform-style: preserve-3d;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(99, 102, 241, 0.5),
      transparent
    );
    border-radius: 24px 24px 0 0;
  }

  &:after {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    background: linear-gradient(
      135deg,
      rgba(99, 102, 241, 0.1),
      transparent,
      rgba(139, 92, 246, 0.1)
    );
    border-radius: 24px;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  ${Card}:hover &:after {
    opacity: 1;
  }
`;

const CardGlow = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle,
    rgba(99, 102, 241, 0.3) 0%,
    transparent 70%
  );
  transform: translate(-50%, -50%);
  border-radius: 50%;
  filter: blur(40px);
  z-index: -2;
  animation: ${glow} 4s ease-in-out infinite;
  pointer-events: none;
`;

export default FloatingCard;
