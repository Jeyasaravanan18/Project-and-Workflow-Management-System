import PropTypes from 'prop-types';

const PageContainer = ({
    title,
    subtitle,
    breadcrumbs = [],
    actions,
    children,
    loading = false
}) => {
    return (
        <div className="page-container">
            {breadcrumbs.length > 0 && (
                <nav className="breadcrumbs">
                    {breadcrumbs.map((crumb, idx) => (
                        <span key={idx}>
                            {idx > 0 && <span className="breadcrumb-separator">/</span>}
                            {crumb.href ? (
                                <a href={crumb.href} className="breadcrumb-link">{crumb.label}</a>
                            ) : (
                                <span className="breadcrumb-current">{crumb.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            )}

            {(title || actions) && (
                <div className="page-header-main">
                    <div className="page-header-content">
                        {title && <h1 className="page-title">{title}</h1>}
                        {subtitle && <p className="page-subtitle">{subtitle}</p>}
                    </div>
                    {actions && (
                        <div className="page-header-actions">
                            {actions}
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="page-content">
                    {children}
                </div>
            )}
        </div>
    );
};

PageContainer.propTypes = {
    title: PropTypes.string,
    subtitle: PropTypes.string,
    breadcrumbs: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string
    })),
    actions: PropTypes.node,
    children: PropTypes.node.isRequired,
    loading: PropTypes.bool
};

export default PageContainer;
