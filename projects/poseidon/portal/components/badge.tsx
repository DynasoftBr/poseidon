import type { ReactNode } from 'react';

export default function Badge({ children }: { children: ReactNode }) {
    return <span className="rounded-md bg-selected px-2 py-1 text-xs text-accent">{children}</span>;
}
