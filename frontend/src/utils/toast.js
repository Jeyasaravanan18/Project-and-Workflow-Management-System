/**
 * Centralized toast notification utility for Harmonic Halo.
 * Wraps react-hot-toast with consistent styling and enterprise-grade UX patterns.
 *
 * Usage:
 *   import toast from '../utils/toast';
 *   toast.success('Project created!');
 *   toast.error('Failed to load data');
 *   toast.info('Refreshing...');
 *   toast.loading('Saving changes...');
 *   toast.dismiss(id);
 */

import { toast as _toast } from 'react-hot-toast';

const defaultOpts = {
    duration: 3500,
    style: {
        fontFamily: "'Inter', 'Outfit', sans-serif",
        fontSize: '14px',
        fontWeight: '500',
        borderRadius: '10px',
        padding: '12px 16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        maxWidth: '380px',
    },
};

const toast = {
    success: (msg, opts = {}) =>
        _toast.success(msg, {
            ...defaultOpts,
            style: {
                ...defaultOpts.style,
                background: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
            },
            iconTheme: { primary: '#22c55e', secondary: '#f0fdf4' },
            ...opts,
        }),

    error: (msg, opts = {}) =>
        _toast.error(msg, {
            ...defaultOpts,
            duration: 5000,
            style: {
                ...defaultOpts.style,
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
            },
            iconTheme: { primary: '#ef4444', secondary: '#fef2f2' },
            ...opts,
        }),

    info: (msg, opts = {}) =>
        _toast(msg, {
            ...defaultOpts,
            style: {
                ...defaultOpts.style,
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
            },
            icon: 'ℹ️',
            ...opts,
        }),

    warning: (msg, opts = {}) =>
        _toast(msg, {
            ...defaultOpts,
            style: {
                ...defaultOpts.style,
                background: '#fffbeb',
                color: '#d97706',
                border: '1px solid #fde68a',
            },
            icon: '⚠️',
            ...opts,
        }),

    loading: (msg, opts = {}) =>
        _toast.loading(msg, {
            ...defaultOpts,
            style: {
                ...defaultOpts.style,
                background: '#f8fafc',
                color: '#475569',
                border: '1px solid #e2e8f0',
            },
            ...opts,
        }),

    dismiss: (id) => _toast.dismiss(id),

    promise: (promise, messages, opts = {}) =>
        _toast.promise(
            promise,
            {
                loading: messages.loading || 'Processing...',
                success: messages.success || 'Done!',
                error: messages.error || 'Something went wrong',
            },
            { ...defaultOpts, ...opts }
        ),
};

export default toast;
