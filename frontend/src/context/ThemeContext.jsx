
import { createContext, useState, useContext, useEffect } from 'react';
import { ThemeProvider } from 'styled-components';

const ThemeContext = createContext();

export const lightTheme = {
    mode: 'light',
    bg: {
        primary: '#F4F4F4', // Carbon Gray 10 Base
        secondary: '#FFFFFF', // Carbon Gray 10 Layer 1 (Cards)
        tertiary: '#E5E5E5', // Carbon Gray 10 Layer 2
        card: '#FFFFFF',
        hover: '#E5E5E5', // Gray 10 Hover
    },
    text: {
        primary: '#161616', // Gray 100
        secondary: '#525252', // Gray 70
        tertiary: '#8D8D8D', // Gray 50
    },
    border: '#E0E0E0', // Gray 20
    accent: {
        primary: '#0F62FE', // Blue 60
        secondary: '#0043CE', // Blue 70 (Hover)
        success: '#24A148', // Green 50
        danger: '#DA1E28', // Red 60
        warning: '#F1C21B', // Yellow 30
    },
    shadow: {
        sm: 'none',
        md: '0 2px 6px rgba(0,0,0,0.1)',
        lg: '0 4px 8px rgba(0,0,0,0.1)',
    }
};

export const darkTheme = {
    mode: 'dark',
    bg: {
        primary: '#161616', // Carbon Gray 90 Base
        secondary: '#262626', // Carbon Gray 90 Layer 1 (Cards)
        tertiary: '#393939', // Carbon Gray 90 Layer 2
        card: '#262626',
        hover: '#393939', // Gray 90 Hover
    },
    text: {
        primary: '#F4F4F4', // Gray 10
        secondary: '#C6C6C6', // Gray 30
        tertiary: '#8D8D8D', // Gray 50
    },
    border: '#393939', // Gray 80
    accent: {
        primary: '#0F62FE', // Blue 60 (Carbon uses Blue 60 on Gray 90)
        secondary: '#0043CE', // Blue 70 (Hover)
        success: '#42BE65', // Green 40
        danger: '#FA4D56', // Red 50
        warning: '#F1C21B', // Yellow 30
    },
    shadow: {
        sm: 'none',
        md: '0 4px 8px rgba(0,0,0,0.5)',
        lg: '0 8px 16px rgba(0,0,0,0.5)',
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
