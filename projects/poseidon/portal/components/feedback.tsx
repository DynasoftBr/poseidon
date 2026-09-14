import type { ReactNode } from 'react';
import { twMerge } from '@poseidon/ui';

export default function Feedback({
    kind = 'info',
    children,
}: {
    kind?: 'info' | 'error' | 'success';
    children: ReactNode;
}) {
    return (
        <div
            role={kind === 'error' ? 'alert' : 'status'}
            className={twMerge(
                'rounded-lg border border-line p-4 text-sm',
                kind === 'error' ? 'text-danger' : 'text-ink',
            )}
        >
            {children}
        </div>
    );
}
