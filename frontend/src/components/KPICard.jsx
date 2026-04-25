import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const KPICard = ({ title, value, trend, icon: Icon, color = 'primary', subtitle }) => {
    const getTrendIcon = () => {
        if (!trend && trend !== 0) return null;
        if (trend > 0) return <TrendingUp size={16} />;
        if (trend < 0) return <TrendingDown size={16} />;
        return <Minus size={16} />;
    };

    const getTrendColor = () => {
        if (!trend && trend !== 0) return 'var(--slate-400)';
        if (trend > 0) return 'var(--success-400)';
        if (trend < 0) return 'var(--danger-400)';
        return 'var(--slate-400)';
    };

    const colorMap = {
        primary: 'var(--primary-400)',
        success: 'var(--success-400)',
        warning: 'var(--warning-400)',
        danger: 'var(--danger-400)',
        info: 'rgb(59, 130, 246)'
    };

    return (
        <div className="card" style={{
            padding: 'var(--space-6)',
            background: 'linear-gradient(135deg, var(--slate-800) 0%, var(--slate-850) 100%)',
            border: '1px solid var(--slate-700)',
            transition: 'all var(--transition-base)',
            cursor: 'default'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colorMap[color];
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--slate-700)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 'var(--space-4)'
            }}>
                <div>
                    <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--slate-400)',
                        marginBottom: 'var(--space-2)',
                        fontWeight: 500
                    }}>
                        {title}
                    </p>
                    <h3 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: 'var(--slate-50)',
                        lineHeight: 1
                    }}>
                        {value}
                    </h3>
                </div>
                {Icon && (
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-lg)',
                        background: `${colorMap[color]}15`,
                        border: `1px solid ${colorMap[color]}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colorMap[color]
                    }}>
                        <Icon size={24} />
                    </div>
                )}
            </div>

            {subtitle && (
                <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--slate-500)',
                    marginBottom: 'var(--space-2)'
                }}>
                    {subtitle}
                </p>
            )}

            {(trend || trend === 0) && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    fontSize: '0.875rem',
                    color: getTrendColor(),
                    fontWeight: 600
                }}>
                    {getTrendIcon()}
                    <span>
                        {Math.abs(trend)}% {trend >= 0 ? 'increase' : 'decrease'}
                    </span>
                    <span style={{ color: 'var(--slate-500)', fontWeight: 400 }}>
                        vs last period
                    </span>
                </div>
            )}
        </div>
    );
};

export default KPICard;
