import PropTypes from 'prop-types';

export const Grid = ({ children, cols = 1, gap = 6, className = '' }) => {
    const gridClass = `grid gap-${gap} grid-cols-1 ${cols === 2 ? 'md:grid-cols-2' :
            cols === 3 ? 'md:grid-cols-2 lg:grid-cols-3' :
                cols === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
                    cols === 'auto' ? 'grid-cols-[repeat(auto-fit,minmax(300px,1fr))]' :
                        ''
        } ${className}`;

    return <div className={gridClass}>{children}</div>;
};

Grid.propTypes = {
    children: PropTypes.node.isRequired,
    cols: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['auto'])]),
    gap: PropTypes.number,
    className: PropTypes.string
};

export const Stack = ({ children, direction = 'vertical', gap = 4, align = 'start', className = '' }) => {
    const flexClass = `flex ${direction === 'vertical' ? 'flex-col' : 'flex-row'
        } gap-${gap} items-${align} ${className}`;

    return <div className={flexClass}>{children}</div>;
};

Stack.propTypes = {
    children: PropTypes.node.isRequired,
    direction: PropTypes.oneOf(['vertical', 'horizontal']),
    gap: PropTypes.number,
    align: PropTypes.oneOf(['start', 'center', 'end', 'stretch']),
    className: PropTypes.string
};

export const Flex = ({ children, justify = 'start', align = 'start', wrap = false, gap = 0, className = '' }) => {
    return (
        <div className={`flex justify-${justify} items-${align} ${wrap ? 'flex-wrap' : ''} gap-${gap} ${className}`}>
            {children}
        </div>
    );
};

Flex.propTypes = {
    children: PropTypes.node.isRequired,
    justify: PropTypes.oneOf(['start', 'end', 'center', 'between', 'around', 'evenly']),
    align: PropTypes.oneOf(['start', 'end', 'center', 'baseline', 'stretch']),
    wrap: PropTypes.bool,
    gap: PropTypes.number,
    className: PropTypes.string
};
