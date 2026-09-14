import type { InputHTMLAttributes } from 'react';
import { twMerge } from '@poseidon/ui';

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className={twMerge(
                'min-h-11 w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink disabled:opacity-50',
                className,
            )}
        />
    );
}
