import React from 'styled-components';
import styled from 'styled-components';

const DashboardCard = ({ title, value, icon: Icon, color = 'primary', subtitle }) => {
  return (
    <Card $color={color}>
      <CardContent>
        {Icon && (
          <IconWrapper $color={color}>
            <Icon size={24} />
          </IconWrapper>
        )}
        <Stats>
          <Value>{value}</Value>
          <Title>{title}</Title>
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
        </Stats>
      </CardContent>
    </Card>
  );
};

const Card = styled.div`
  position: relative;
  background: #ffffff;
  border-radius: 16px;
  border: 2px solid ${props => {
    const colors = {
      primary: '#e2e8f0',
      slate: '#e2e8f0',
      success: '#d1fae5',
      amber: '#fed7aa',
      warning: '#fef3c7',
      rose: '#fee2e2',
      danger: '#fee2e2',
      info: '#e2e8f0',
    };
    return colors[props.$color] || colors.primary;
  }};
  padding: 24px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  &:hover {
    transform: translateY(-2px);
    border-color: ${props => {
    const colors = {
      primary: '#475569',
      slate: '#475569',
      success: '#22c55e',
      amber: '#f97316',
      warning: '#f59e0b',
      rose: '#ef4444',
      danger: '#ef4444',
      info: '#64748b',
    };
    return colors[props.$color] || colors.primary;
  }};
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => {
    const colors = {
      primary: '#475569',
      slate: '#475569',
      success: '#22c55e',
      amber: '#f97316',
      warning: '#f59e0b',
      rose: '#ef4444',
      danger: '#ef4444',
      info: '#64748b',
    };
    return colors[props.$color] || colors.primary;
  }};
    border-radius: 16px 16px 0 0;
  }
`;

const CardContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const IconWrapper = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    const colors = {
      primary: '#475569',
      slate: '#475569',
      success: '#22c55e',
      amber: '#f97316',
      warning: '#f59e0b',
      rose: '#ef4444',
      danger: '#ef4444',
      info: '#64748b',
    };
    return colors[props.$color] || colors.primary;
  }};
  color: white;
  box-shadow: 0 4px 12px ${props => {
    const colors = {
      primary: 'rgba(71, 85, 105, 0.25)',
      slate: 'rgba(71, 85, 105, 0.25)',
      success: 'rgba(34, 197, 94, 0.25)',
      amber: 'rgba(249, 115, 22, 0.25)',
      warning: 'rgba(245, 158, 11, 0.25)',
      rose: 'rgba(239, 68, 68, 0.25)',
      danger: 'rgba(239, 68, 68, 0.25)',
      info: 'rgba(100, 116, 139, 0.25)',
    };
    return colors[props.$color] || colors.primary;
  }};
`;

const Stats = styled.div`
  flex: 1;
`;

const Value = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
  margin-bottom: 8px;
`;

const Title = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Subtitle = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 4px;
`;

export default DashboardCard;
