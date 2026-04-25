import PropTypes from 'prop-types';

const ProgressRing = ({
    progress = 0,
    size = 120,
    strokeWidth = 8,
    color = '#6366f1',
    showPercentage = true,
    label,
    className = ''
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className={`progress-ring relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="none"
                    className="text-slate-700"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                />
            </svg>

            {(showPercentage || label) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {showPercentage && (
                        <span className="text-2xl font-bold text-white">
                            {Math.round(progress)}%
                        </span>
                    )}
                    {label && (
                        <span className="text-xs text-slate-400 mt-1">
                            {label}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

ProgressRing.propTypes = {
    progress: PropTypes.number,
    size: PropTypes.number,
    strokeWidth: PropTypes.number,
    color: PropTypes.string,
    showPercentage: PropTypes.bool,
    label: PropTypes.string,
    className: PropTypes.string
};

export default ProgressRing;
