/**
 * KeyboardShortcutsOverlay — Feature 2
 * Press "?" anywhere in the app to open a beautiful modal showing all shortcuts.
 * Dismiss with Escape or click outside.
 */
import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
    {
        group: 'Navigation',
        items: [
            { keys: ['G', 'H'], description: 'Go to Dashboard' },
            { keys: ['G', 'P'], description: 'Go to Projects' },
            { keys: ['G', 'W'], description: 'Go to My Work' },
            { keys: ['G', 'A'], description: 'Go to Analytics' },
            { keys: ['G', 'N'], description: 'Go to Notifications' },
        ]
    },
    {
        group: 'Actions',
        items: [
            { keys: ['/'], description: 'Open Global Search' },
            { keys: ['?'], description: 'Show Keyboard Shortcuts' },
            { keys: ['Esc'], description: 'Close Modal / Cancel' },
            { keys: ['Ctrl', 'K'], description: 'Command Palette (Search)' },
        ]
    },
    {
        group: 'Tasks',
        items: [
            { keys: ['N'], description: 'Create New Task' },
            { keys: ['E'], description: 'Export Current View' },
            { keys: ['R'], description: 'Refresh Data' },
            { keys: ['F'], description: 'Toggle Filters' },
        ]
    },
    {
        group: 'Interface',
        items: [
            { keys: ['['], description: 'Collapse Sidebar' },
            { keys: [']'], description: 'Expand Sidebar' },
            { keys: ['D'], description: 'Toggle Dark / Light Mode' },
            { keys: ['Ctrl', 'E'], description: 'Export Report' },
        ]
    }
];

const KeyboardShortcutsOverlay = () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handleKey = (e) => {
            // Don't fire when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
            if (e.key === '?') {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    if (!open) return null;

    return (
        <Overlay onClick={() => setOpen(false)}>
            <Modal onClick={e => e.stopPropagation()}>
                <ModalHeader>
                    <HeaderLeft>
                        <Keyboard size={22} color="#f97316" />
                        <div>
                            <ModalTitle>Keyboard Shortcuts</ModalTitle>
                            <ModalSub>Press <Kbd inline>?</Kbd> to toggle • <Kbd inline>Esc</Kbd> to close</ModalSub>
                        </div>
                    </HeaderLeft>
                    <CloseBtn onClick={() => setOpen(false)}>
                        <X size={18} />
                    </CloseBtn>
                </ModalHeader>

                <Grid>
                    {SHORTCUTS.map(section => (
                        <Section key={section.group}>
                            <SectionTitle>{section.group}</SectionTitle>
                            {section.items.map(item => (
                                <ShortcutRow key={item.description}>
                                    <ShortcutDesc>{item.description}</ShortcutDesc>
                                    <KeyCombo>
                                        {item.keys.map((k, i) => (
                                            <span key={k}>
                                                {i > 0 && <Plus>+</Plus>}
                                                <Kbd>{k}</Kbd>
                                            </span>
                                        ))}
                                    </KeyCombo>
                                </ShortcutRow>
                            ))}
                        </Section>
                    ))}
                </Grid>

                <Footer>
                    <FooterHint>💡 Shortcuts only work when not focused on an input field.</FooterHint>
                </Footer>
            </Modal>
        </Overlay>
    );
};

const fadeIn = keyframes`
    from { opacity: 0; } to { opacity: 1; }
`;
const slideUp = keyframes`
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
`;

const Overlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: ${fadeIn} 0.15s ease;
    padding: 24px;
`;

const Modal = styled.div`
    background: ${p => p.theme.bg.primary};
    border: 1px solid ${p => p.theme.border};
    border-radius: 24px;
    width: 100%;
    max-width: 760px;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 32px 80px rgba(0,0,0,0.25);
    animation: ${slideUp} 0.2s cubic-bezier(0.4,0,0.2,1);

    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-thumb { background: ${p => p.theme.border}; border-radius: 4px; }
`;

const ModalHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28px 32px 20px;
    border-bottom: 1px solid ${p => p.theme.border};
    position: sticky;
    top: 0;
    background: ${p => p.theme.bg.primary};
    z-index: 1;
`;

const HeaderLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
`;

const ModalTitle = styled.h2`
    font-size: 1.2rem;
    font-weight: 800;
    color: ${p => p.theme.text.primary};
    margin: 0 0 4px;
    letter-spacing: -0.02em;
`;

const ModalSub = styled.p`
    font-size: 0.8rem;
    color: ${p => p.theme.text.tertiary};
    margin: 0;
`;

const CloseBtn = styled.button`
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    background: ${p => p.theme.bg.hover};
    border: 1px solid ${p => p.theme.border};
    border-radius: 10px;
    color: ${p => p.theme.text.secondary};
    cursor: pointer;
    transition: all 0.15s;
    &:hover { background: ${p => p.theme.bg.tertiary}; color: ${p => p.theme.text.primary}; }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    padding: 8px;

    @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const Section = styled.div`
    padding: 20px 24px;
    border-radius: 12px;
    transition: background 0.15s;
    &:hover { background: ${p => p.theme.bg.hover}; }
`;

const SectionTitle = styled.div`
    font-size: 0.7rem;
    font-weight: 800;
    color: #f97316;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 12px;
`;

const ShortcutRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 0;
    border-bottom: 1px solid ${p => p.theme.border + '60'};
    &:last-child { border-bottom: none; }
`;

const ShortcutDesc = styled.span`
    font-size: 0.875rem;
    color: ${p => p.theme.text.secondary};
    font-weight: 500;
`;

const KeyCombo = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
`;

const Kbd = styled.kbd`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: ${p => p.inline ? 'auto' : '28px'};
    height: ${p => p.inline ? 'auto' : '24px'};
    padding: ${p => p.inline ? '1px 5px' : '0 7px'};
    background: ${p => p.theme.bg.hover};
    border: 1px solid ${p => p.theme.border};
    border-bottom-width: 2px;
    border-radius: 6px;
    font-family: 'Fira Code', 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    font-weight: 700;
    color: ${p => p.theme.text.primary};
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`;

const Plus = styled.span`
    font-size: 0.7rem;
    color: ${p => p.theme.text.tertiary};
    margin: 0 2px;
`;

const Footer = styled.div`
    padding: 16px 32px;
    border-top: 1px solid ${p => p.theme.border};
`;

const FooterHint = styled.p`
    font-size: 0.8rem;
    color: ${p => p.theme.text.tertiary};
    margin: 0;
    text-align: center;
`;

export default KeyboardShortcutsOverlay;
