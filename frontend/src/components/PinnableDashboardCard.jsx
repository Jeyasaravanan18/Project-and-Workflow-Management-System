/**
 * PinnableDashboardCard — Feature 5
 * Any admin stat card can be pinned/unpinned to the org dashboard.
 * Pin state is persisted in localStorage per-user.
 * Usage:
 *   <PinnableDashboardCard cardId="total-projects" title="Total Projects" adminOnly>
 *     ... your card content ...
 *   </PinnableDashboardCard>
 */
import { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { Pin, PinOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'pinned_dashboard_cards';

const getPinnedCards = (userId) => {
    try {
        const raw = localStorage.getItem(`${STORAGE_KEY}:${userId}`);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const setPinnedCards = (userId, cards) => {
    try {
        localStorage.setItem(`${STORAGE_KEY}:${userId}`, JSON.stringify(cards));
    } catch {}
};

// Hook to get all pinned card IDs for current user
export const usePinnedCards = () => {
    const { user } = useAuth();
    const [pinned, setPinned] = useState(() => getPinnedCards(user?._id));

    const toggle = useCallback((cardId) => {
        setPinned(prev => {
            const next = prev.includes(cardId)
                ? prev.filter(id => id !== cardId)
                : [...prev, cardId];
            setPinnedCards(user?._id, next);
            return next;
        });
    }, [user?._id]);

    const isPinned = useCallback((cardId) => pinned.includes(cardId), [pinned]);

    return { pinned, toggle, isPinned };
};

// The wrapper component
const PinnableDashboardCard = ({
    cardId,
    title,
    children,
    adminOnly = true,
    className
}) => {
    const { user } = useAuth();
    const { isPinned, toggle } = usePinnedCards();
    const [showHint, setShowHint] = useState(false);
    const pinned = isPinned(cardId);

    // Only admins and managers can pin
    const canPin = user?.role === 'admin' || user?.role === 'manager';
    if (adminOnly && !canPin) {
        return <CardWrapper className={className}>{children}</CardWrapper>;
    }

    return (
        <CardWrapper
            className={className}
            $pinned={pinned}
            onMouseEnter={() => setShowHint(true)}
            onMouseLeave={() => setShowHint(false)}
        >
            {children}
            <PinButton
                $pinned={pinned}
                $visible={showHint || pinned}
                onClick={() => toggle(cardId)}
                title={pinned ? 'Unpin from dashboard' : 'Pin to dashboard'}
            >
                {pinned ? <PinOff size={13} /> : <Pin size={13} />}
                {pinned ? 'Unpin' : 'Pin'}
            </PinButton>
            {pinned && <PinnedBadge>📌 Pinned</PinnedBadge>}
        </CardWrapper>
    );
};

// Separate component: shows all pinned cards in the Dashboard header area
export const PinnedCardsBar = ({ allCards }) => {
    const { user } = useAuth();
    const { pinned } = usePinnedCards();

    if (user?.role !== 'admin' || pinned.length === 0) return null;

    const pinnedCards = allCards.filter(c => pinned.includes(c.id));

    return (
        <Bar>
            <BarTitle>📌 Pinned Widgets</BarTitle>
            <BarGrid>
                {pinnedCards.map(card => (
                    <BarCard key={card.id}>
                        <BarCardTitle>{card.title}</BarCardTitle>
                        <BarCardValue style={{ color: card.color || '#0F62FE' }}>
                            {card.value}
                        </BarCardValue>
                        <BarCardSub>{card.subtitle}</BarCardSub>
                    </BarCard>
                ))}
            </BarGrid>
        </Bar>
    );
};

const popIn = keyframes`
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
`;

const CardWrapper = styled.div`
    position: relative;
    outline: ${p => p.$pinned ? '2px solid #0F62FE' : 'none'};
    outline-offset: 2px;
    border-radius: 0;
    transition: outline 0.2s;
`;

const PinButton = styled.button`
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: ${p => p.$pinned ? '#0F62FE' : 'white'};
    color: ${p => p.$pinned ? 'white' : '#525252'};
    border: 1px solid ${p => p.$pinned ? '#0F62FE' : '#e0e0e0'};
    border-radius: 0;
    font-size: 0.75rem;
    font-weight: 400;
    cursor: pointer;
    opacity: ${p => p.$visible ? 1 : 0};
    pointer-events: ${p => p.$visible ? 'auto' : 'none'};
    transition: all 0.1s;
    z-index: 5;
    box-shadow: none;

    &:hover {
        background: ${p => p.$pinned ? '#0043CE' : '#f4f4f4'};
    }
`;

const PinnedBadge = styled.div`
    position: absolute;
    bottom: 8px;
    right: 8px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #0F62FE;
    background: #edf5ff;
    border: 1px solid #d0e2ff;
    border-radius: 0;
    padding: 1px 6px;
    animation: ${popIn} 0.2s ease;
`;

const Bar = styled.div`
    margin-bottom: 32px;
    padding: 24px;
    background: ${p => p.theme.bg.card};
    border: 1px solid #d0e2ff;
    border-radius: 0;
    box-shadow: none;
`;

const BarTitle = styled.div`
    font-size: 0.75rem;
    font-weight: 600;
    color: #0F62FE;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 16px;
`;

const BarGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
`;

const BarCard = styled.div`
    background: ${p => p.theme.bg.primary};
    border: 1px solid ${p => p.theme.border};
    border-radius: 0;
    padding: 16px;
`;

const BarCardTitle = styled.div`
    font-size: 0.72rem;
    color: ${p => p.theme.text.tertiary};
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
    margin-bottom: 6px;
`;

const BarCardValue = styled.div`
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 4px;
    letter-spacing: -0.02em;
`;

const BarCardSub = styled.div`
    font-size: 0.72rem;
    color: ${p => p.theme.text.tertiary};
`;

export default PinnableDashboardCard;
