import type { ReactNode } from 'react';

export default function Table({ children, label }: { children: ReactNode; label: string }) {
    return (
        <div role="region" aria-label={label} tabIndex={0} className="max-w-full overflow-x-auto">
            <table className="w-full min-w-120 text-left text-sm [&_td]:border-b [&_td]:border-line [&_td]:p-3 [&_th]:p-3 [&_th]:text-muted">
                {children}
            </table>
        </div>
    );
}
