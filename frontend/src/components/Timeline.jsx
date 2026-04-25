import PropTypes from 'prop-types';

const Timeline = ({ items, className = '' }) => {
    return (
        <div className={`timeline relative ${className}`}>
            {items.map((item, idx) => (
                <div key={idx} className="timeline-item flex gap-4 pb-8 last:pb-0 relative">
                    {/* Line */}
                    {idx < items.length - 1 && (
                        <div className="absolute left-5 top-12 bottom-0 w-px bg-slate-200" />
                    )}

                    {/* Icon/Dot */}
                    <div className="timeline-icon relative z-10 flex-shrink-0">
                        {item.icon ? (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${item.variant === 'success' ? 'bg-green-50 text-green-600 border-green-200' :
                                item.variant === 'warning' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                    item.variant === 'danger' ? 'bg-red-50 text-red-600 border-red-200' :
                                        'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>
                                {item.icon}
                            </div>
                        ) : (
                            <div className={`w-10 h-10 rounded-full border-4 ${item.variant === 'success' ? 'border-green-500 bg-white' :
                                item.variant === 'warning' ? 'border-orange-500 bg-white' :
                                    item.variant === 'danger' ? 'border-red-500 bg-white' :
                                        'border-slate-500 bg-white'
                                }`} />
                        )}
                    </div>

                    {/* Content */}
                    <div className="timeline-content flex-1 pt-1">
                        <div className="flex items-start justify-between mb-1">
                            <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                            {item.time && (
                                <span className="text-xs text-slate-500 font-medium">{item.time}</span>
                            )}
                        </div>
                        {item.description && (
                            <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                        )}
                        {item.content}
                    </div>
                </div>
            ))}
        </div>
    );
};

Timeline.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        time: PropTypes.string,
        icon: PropTypes.node,
        variant: PropTypes.oneOf(['default', 'success', 'warning', 'danger']),
        content: PropTypes.node
    })).isRequired,
    className: PropTypes.string
};

export default Timeline;
