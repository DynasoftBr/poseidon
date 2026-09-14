import type { SelectHTMLAttributes } from 'react';
import { twMerge } from '@poseidon/ui';

export default function Select({
    className,
    children,
    ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props}
            className={twMerge(
                'min-h-11 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink',
                className,
            )}
        >
            {children}
        </select>
    );
}
