
import { createContext, useState, useContext, useEffect } from 'react';
import { ThemeProvider } from 'styled-components';

const ThemeContext = createContext();

export const lightTheme = {
    mode: 'light',
    primary: '#1E40AF',
    primaryHover: '#1E3A8A',
    primaryLight: '#EFF6FF',
    bg: {
        primary: '#F8FAFC', // Crisp soft background
        secondary: '#FFFFFF', // Card layer
        tertiary: '#F1F5F9', // Subtle accent background
        card: '#FFFFFF',
        hover: '#F8FAFC',
        activeLight: '#EFF6FF', // Light blue active/badge (blue-50)
    },
    text: {
        primary: '#111827', // Crisp dark text
        secondary: '#4B5563', // Neutral text
        tertiary: '#9CA3AF', // Muted text
        muted: '#6B7280',
    },
    border: '#E5E7EB', // Subtle neutral border
    borderFocus: '#1E40AF',
    accent: {
        primary: '#1E40AF', // Enterprise Dark Blue
        secondary: '#1E3A8A', // Dark navy hover
        light: '#EFF6FF', // Light blue tag/badge
        dark: '#111827', // High-contrast action dark
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
    },
    radius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        pill: '9999px',
    },
    shadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.03)',
    }
};

export const darkTheme = {
    mode: 'dark',
    primary: '#3B82F6',
    primaryHover: '#1D4ED8',
    primaryLight: 'rgba(59, 130, 246, 0.15)',
    bg: {
        primary: '#0B0F17',
        secondary: '#131B2A',
        tertiary: '#1E293B',
        card: '#131B2A',
        hover: '#1E293B',
        activeLight: 'rgba(30, 64, 175, 0.25)',
    },
    text: {
        primary: '#F9FAFB',
        secondary: '#94A3B8',
        tertiary: '#64748B',
        muted: '#94A3B8',
    },
    border: '#1E293B',
    borderFocus: '#3B82F6',
    accent: {
        primary: '#3B82F6',
        secondary: '#1D4ED8',
        light: 'rgba(59, 130, 246, 0.15)',
        dark: '#F9FAFB',
        success: '#10B981',
        danger: '#F87171',
        warning: '#FBBF24',
        info: '#60A5FA',
    },
    radius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        pill: '9999px',
    },
    shadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    }
};

export const useTheme = () => useContext(ThemeContext);

export const CustomThemeProvider = ({ children }) => {
    // Check local storage or system preference
    const [themeMode, setThemeMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const toggleTheme = () => {
        setThemeMode(prev => {
            const newMode = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newMode);
            return newMode;
        });
    };

    useEffect(() => {
        const root = document.documentElement;
        if (themeMode === 'dark') {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
            document.body.style.backgroundColor = '#0B0F17';
            document.body.style.color = '#F9FAFB';
        } else {
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
            document.body.style.backgroundColor = '#F8FAFC';
            document.body.style.color = '#111827';
        }
    }, [themeMode]);

    const theme = themeMode === 'light' ? lightTheme : darkTheme;

    return (
        <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};
