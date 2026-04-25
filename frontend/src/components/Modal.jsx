import { X } from 'lucide-react';
import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 'var(--z-modal-backdrop)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-4)',
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)'
            }}
            className="animate-fade-in"
            onClick={onClose}
        >
            <div
                className="animate-scale-in"
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: sizeClasses[size] || sizeClasses.md,
                    background: 'var(--slate-900)',
                    border: '1px solid var(--slate-700)',
                    borderRadius: '0',
                    boxShadow: 'none',
                    zIndex: 'var(--z-modal)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-6)',
                    borderBottom: '1px solid var(--slate-700)'
                }}>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--slate-50)',
                        margin: 0
                    }}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            padding: 'var(--space-2)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all var(--transition-base)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--slate-700)';
                            e.currentTarget.style.color = 'var(--slate-100)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--slate-400)';
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    padding: 'var(--space-6)',
                    overflowY: 'auto',
                    maxHeight: '70vh'
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
