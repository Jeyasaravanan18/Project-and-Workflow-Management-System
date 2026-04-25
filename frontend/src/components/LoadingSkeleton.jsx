const LoadingSkeleton = ({ type = 'card', count = 1 }) => {
    const SkeletonCard = () => (
        <div className="skeleton skeleton-card" style={{
            background: 'linear-gradient(90deg, var(--slate-800) 0%, var(--slate-700) 50%, var(--slate-800) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)'
        }}>
            <div className="skeleton-title"></div>
            <div className="skeleton-text" style={{ width: '40%' }}></div>
            <div className="skeleton-text" style={{ width: '80%', marginTop: 'var(--space-4)' }}></div>
            <div className="skeleton-text" style={{ width: '60%' }}></div>
        </div>
    );

    const SkeletonRow = () => (
        <tr>
            {[1, 2, 3, 4].map((i) => (
                <td key={i} style={{ padding: 'var(--space-4)' }}>
                    <div className="skeleton skeleton-text"></div>
                </td>
            ))}
        </tr>
    );

    const SkeletonText = () => (
        <div className="skeleton skeleton-text"></div>
    );

    const SkeletonKPI = () => (
        <div className="card animate-pulse" style={{ minHeight: '120px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-lg)' }}></div>
            </div>
            <div className="skeleton skeleton-text" style={{ width: '60%', height: '2rem', marginBottom: 'var(--space-2)' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '40%', height: '1rem' }}></div>
        </div>
    );

    if (type === 'table') {
        return (
            <>
                {Array.from({ length: count }).map((_, i) => (
                    <SkeletonRow key={i} />
                ))}
            </>
        );
    }

    if (type === 'text') {
        return (
            <>
                {Array.from({ length: count }).map((_, i) => (
                    <SkeletonText key={i} />
                ))}
            </>
        );
    }

    if (type === 'kpi') {
        return (
            <>
                {Array.from({ length: count }).map((_, i) => (
                    <SkeletonKPI key={i} />
                ))}
            </>
        );
    }

    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </>
    );
};

export default LoadingSkeleton;
