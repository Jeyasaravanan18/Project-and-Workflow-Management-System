import PropTypes from 'prop-types';

const Badge = ({
    children,
    variant = 'default',
    size = 'md',
    pill = false,
    icon,
    className = ''
}) => {
    const variants = {
        default: 'bg-slate-800 text-slate-300 border-slate-600',
        neutral: 'bg-slate-800 text-slate-300 border-slate-600',
        primary: 'bg-blue-900/20 text-blue-400 border-blue-500/30',
        success: 'bg-green-900/20 text-green-400 border-green-500/30',
        warning: 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30',
        danger: 'bg-red-900/20 text-red-400 border-red-500/30',
        info: 'bg-cyan-900/20 text-cyan-400 border-cyan-500/30'
    };

    const sizes = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5'
    };

    return (
        <span className={`
            inline-flex items-center gap-1.5 font-medium border
            ${variants[variant]}
            ${sizes[size]}
            ${pill ? 'rounded-none' : 'rounded-none'}
            ${className}
        `}>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </span>
    );
};

Badge.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(['default', 'neutral', 'primary', 'success', 'warning', 'danger', 'info']),
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    pill: PropTypes.bool,
    icon: PropTypes.node,
    className: PropTypes.string
};

export default Badge;
