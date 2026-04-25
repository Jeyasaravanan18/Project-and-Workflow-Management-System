import PropTypes from 'prop-types';

const Avatar = ({
    name,
    src,
    size = 'md',
    status,
    className = ''
}) => {
    const sizeClasses = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-xl'
    };

    const initials = name
        ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <div className={`avatar relative ${sizeClasses[size]} ${className}`}>
            {src ? (
                <img src={src} alt={name} className="rounded-none w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full rounded-none bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {initials}
                </div>
            )}

            {status && (
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-none border-2 border-slate-900 ${status === 'online' ? 'bg-green-500' :
                        status === 'away' ? 'bg-yellow-500' :
                            'bg-slate-500'
                    }`} />
            )}
        </div>
    );
};

Avatar.propTypes = {
    name: PropTypes.string,
    src: PropTypes.string,
    size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
    status: PropTypes.oneOf(['online', 'away', 'offline']),
    className: PropTypes.string
};

export default Avatar;
