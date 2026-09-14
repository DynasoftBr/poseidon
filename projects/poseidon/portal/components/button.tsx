import type { ButtonHTMLAttributes } from 'react';
import { twMerge } from '@poseidon/ui';

const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'border border-line bg-surface text-ink hover:bg-selected',
    ghost: 'text-ink hover:bg-selected',
    danger: 'text-danger border border-line hover:bg-selected',
};

export default function Button({
    variant = 'secondary',
    loading = false,
    className,
    children,
    disabled,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: keyof typeof variants;
    loading?: boolean;
}) {
    return (
        <button
            type="button"
            {...props}
            disabled={disabled || loading}
            aria-busy={loading}
            className={twMerge(
                'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50',
                variants[variant],
                className,
            )}
        >
            {loading ? 'Working…' : children}
        </button>
    );
}
