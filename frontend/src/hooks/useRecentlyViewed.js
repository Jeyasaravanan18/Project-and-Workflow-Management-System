import { useState, useCallback, useEffect } from 'react';

const MAX_ITEMS = 5;

/**
 * Tracks the last N visited pages/items.
 * Each entry: { id, label, path, type, timestamp }
 * Usage: const { recentItems, trackVisit } = useRecentlyViewed();
 */
const useRecentlyViewed = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user._id || 'guest';
    const KEY = `wos_recently_viewed_${userId}`;

    const [recentItems, setRecentItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(KEY) || '[]');
        } catch {
            return [];
        }
    });

    // Sync state if user changes
    useEffect(() => {
        try {
            const items = JSON.parse(localStorage.getItem(KEY) || '[]');
            setRecentItems(items);
        } catch {
            setRecentItems([]);
        }
    }, [KEY]);

    const trackVisit = useCallback((item) => {
        // item: { id, label, path, type }
        setRecentItems(prev => {
            // Remove duplicate with same path
            const filtered = prev.filter(i => i.path !== item.path);
            const updated = [
                { ...item, timestamp: Date.now() },
                ...filtered
            ].slice(0, MAX_ITEMS);
            localStorage.setItem(KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const clearRecent = useCallback(() => {
        localStorage.removeItem(KEY);
        setRecentItems([]);
    }, []);

    return { recentItems, trackVisit, clearRecent };
};

export default useRecentlyViewed;
