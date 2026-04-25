import { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Tabs = ({ tabs, defaultTab = 0, onChange, className = '' }) => {
    const [activeTab, setActiveTab] = useState(defaultTab);

    const handleTabChange = (index) => {
        if (tabs[index].disabled) return;
        setActiveTab(index);
        if (onChange) onChange(index);
    };

    return (
        <Container className={className}>
            <TabHeader>
                <TabList>
                    {tabs.map((tab, idx) => (
                        <TabButton
                            key={idx}
                            onClick={() => handleTabChange(idx)}
                            $active={activeTab === idx}
                            disabled={tab.disabled}
                        >
                            <TabLabel>
                                {tab.icon && <IconWrapper>{tab.icon}</IconWrapper>}
                                {tab.label}
                                {tab.badge && (
                                    <Badge $active={activeTab === idx}>
                                        {tab.badge}
                                    </Badge>
                                )}
                            </TabLabel>
                            {activeTab === idx && <ActiveIndicator />}
                        </TabButton>
                    ))}
                </TabList>
            </TabHeader>
            <TabContent>
                {tabs[activeTab]?.content}
            </TabContent>
        </Container>
    );
};

Tabs.propTypes = {
    tabs: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        content: PropTypes.node.isRequired,
        icon: PropTypes.node,
        badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        disabled: PropTypes.bool
    })).isRequired,
    defaultTab: PropTypes.number,
    onChange: PropTypes.func,
    className: PropTypes.string
};

// Styled Components
const Container = styled.div`
    width: 100%;
`;

const TabHeader = styled.div`
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 24px;
`;

const TabList = styled.div`
    display: flex;
    gap: 8px;
`;

const TabButton = styled.button`
    position: relative;
    padding: 12px 20px;
    background: transparent;
    border: none;
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
    opacity: ${props => props.disabled ? 0.5 : 1};
    font-family: inherit;
    transition: all 0.2s ease;
    
    &:hover {
        background: ${props => props.$active ? 'transparent' : '#f8fafc'};
    }
`;

const TabLabel = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9375rem;
    font-weight: ${props => props.$active ? '600' : '500'};
    color: ${props => props.$active ? '#f97316' : '#64748b'};
    transition: color 0.2s ease;

    ${TabButton}:hover & {
        color: ${props => !props.$active && '#0f172a'};
    }
`;

const IconWrapper = styled.span`
    display: flex;
    align-items: center;
    color: currentColor;
    font-size: 1.1em;
`;

const Badge = styled.span`
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
    background: ${props => props.$active ? '#ffedd5' : '#f1f5f9'};
    color: ${props => props.$active ? '#c2410c' : '#64748b'};
    transition: all 0.2s ease;
`;

const ActiveIndicator = styled.div`
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: #f97316;
    border-radius: 2px 2px 0 0;
`;

const TabContent = styled.div`
    animation: fadeIn 0.3s ease-out;
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;

export default Tabs;
