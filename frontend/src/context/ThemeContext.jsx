
import { createContext, useState, useContext, useEffect } from 'react';
import { ThemeProvider } from 'styled-components';

const ThemeContext = createContext();

export const lightTheme = {
    mode: 'light',
    bg: {
        primary: '#F8FAFC', // Brevo crisp soft background
        secondary: '#FFFFFF', // Card layer
        tertiary: '#F1F5F9', // Subtle accent background
        card: '#FFFFFF',
        hover: '#F8FAFC',
        activeLight: '#ECFDF5', // Brevo light emerald badge/active
    },
    text: {
        primary: '#111827', // Crisp dark text
        secondary: '#4B5563', // Neutral text
        tertiary: '#9CA3AF', // Muted text
    },
    border: '#E5E7EB', // Subtle neutral border
    borderFocus: '#008060',
    accent: {
        primary: '#008060', // Brevo Emerald Green
        secondary: '#006D52', // Darker emerald hover
        light: '#ECFDF5', // Light green tag/badge
        dark: '#111827', // High-contrast Brevo action black
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
    bg: {
        primary: '#0B0F17',
        secondary: '#131B2A',
        tertiary: '#1E293B',
        card: '#131B2A',
        hover: '#1E293B',
        activeLight: 'rgba(0, 128, 96, 0.15)',
    },
    text: {
        primary: '#F9FAFB',
        secondary: '#94A3B8',
        tertiary: '#64748B',
    },
    border: '#1E293B',
    borderFocus: '#10B981',
    accent: {
        primary: '#10B981',
        secondary: '#059669',
        light: 'rgba(16, 185, 129, 0.15)',
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

    const theme = themeMode === 'light' ? lightTheme : darkTheme;

    return (
        <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};
