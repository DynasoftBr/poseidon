import type { HTMLAttributes, ReactNode } from 'react';
import { twMerge } from '@poseidon/ui';

type Props = HTMLAttributes<HTMLElement> & {
    children: ReactNode;
    element?: 'aside' | 'nav';
};

export default function Sidebar({ element = 'aside', className, children, ...props }: Props) {
    const styles = twMerge('flex min-h-0 flex-col bg-surface', className);
    return element === 'nav' ? (
        <nav className={styles} {...props}>
            {children}
        </nav>
    ) : (
        <aside className={styles} {...props}>
            {children}
        </aside>
    );
}
