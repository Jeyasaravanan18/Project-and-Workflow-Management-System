const PageHeader = ({ title, subtitle, actions, stats, breadcrumbs }) => {
    return (
        <div className="page-header">
            {breadcrumbs && (
                <nav className="breadcrumbs">
                    {breadcrumbs.map((crumb, index) => (
                        <span key={index}>
                            {index > 0 && <span className="breadcrumb-separator">/</span>}
                            <span className={index === breadcrumbs.length - 1 ? 'breadcrumb-current' : 'breadcrumb-link'}>
                                {crumb}
                            </span>
                        </span>
                    ))}
                </nav>
            )}

            <div className="page-header-main">
                <div className="page-header-content">
                    <h1 className="page-title">{title}</h1>
                    {subtitle && <p className="page-subtitle">{subtitle}</p>}
                </div>

                {actions && (
                    <div className="page-header-actions">
                        {actions}
                    </div>
                )}
            </div>

            {stats && (
                <div className="page-stats">
                    {stats.map((stat, index) => (
                        <div key={index} className="stat-card">
                            {stat.icon && <div className="stat-icon">{stat.icon}</div>}
                            <div className="stat-content">
                                <div className="stat-value">{stat.value}</div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                            {stat.trend && (
                                <div className={`stat-trend ${stat.trend > 0 ? 'positive' : 'negative'}`}>
                                    {stat.trend > 0 ? '↑' : '↓'} {Math.abs(stat.trend)}%
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PageHeader;
