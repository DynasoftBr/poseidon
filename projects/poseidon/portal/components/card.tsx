import type { HTMLAttributes } from 'react';
import { twMerge } from '@poseidon/ui';

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            {...props}
            className={twMerge(
                'min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6',
                className,
            )}
        />
    );
}
