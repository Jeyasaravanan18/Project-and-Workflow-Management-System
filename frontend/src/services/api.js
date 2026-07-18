import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper function to validate token format
const isValidToken = (token) => {
    if (!token || typeof token !== 'string') return false;
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
};

// Helper function to clear invalid user data
const clearAuthData = () => {
    console.warn('[API] Clearing invalid auth data');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
};

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                return config;
            }

            const user = JSON.parse(userStr);

            // Validate user object structure
            if (!user || typeof user !== 'object') {
                console.error('[API] Invalid user object in localStorage');
                clearAuthData();
                return config;
            }

            // Validate token
            if (user.accessToken) {
                if (!isValidToken(user.accessToken)) {
                    console.error('[API] Malformed access token detected, clearing auth data');
                    clearAuthData();
                    window.location.href = '/login';
                    return config;
                }
                config.headers.Authorization = `Bearer ${user.accessToken}`;
            }
        } catch (error) {
            console.error('[API] Error in request interceptor:', error);
            clearAuthData();
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor for token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip global interceptor logic for auth endpoints (let local components handle their own errors)
        if (originalRequest.url && originalRequest.url.includes('/auth/')) {
            return Promise.reject(error);
        }

        // If error is 401 and we haven't retried yet
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                    clearAuthData();
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                const user = JSON.parse(userStr);

                if (!user || !user.refreshToken) {
                    clearAuthData();
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                // Validate refresh token
                if (!isValidToken(user.refreshToken)) {
                    console.error('[API] Malformed refresh token, forcing re-login');
                    clearAuthData();
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                    refreshToken: user.refreshToken
                });

                const tokenPayload = response.data?.data || response.data;
                const { accessToken } = tokenPayload;

                // Validate new access token
                if (!isValidToken(accessToken)) {
                    console.error('[API] Received malformed access token from refresh');
                    clearAuthData();
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                user.accessToken = accessToken;
                localStorage.setItem('user', JSON.stringify(user));

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.error('[API] Token refresh failed:', refreshError);
                clearAuthData();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Handle JWT malformed errors
        if (error.response && error.response.data && error.response.data.message) {
            const message = error.response.data.message.toLowerCase();
            if (message.includes('jwt malformed') || message.includes('invalid token')) {
                console.error('[API] JWT malformed error detected, clearing auth data');
                clearAuthData();
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
