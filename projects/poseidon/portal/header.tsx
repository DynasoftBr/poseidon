import type { ReactNode } from 'react';
import { twMerge } from '@poseidon/ui';

export default function Header({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <header
            className={twMerge(
                'relative z-40 flex h-14 items-center border-b border-line bg-surface px-2 md:px-3',
                className,
            )}
        >
            {children}
        </header>
    );
}
