import type { ReactNode } from 'react';

export default function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="min-w-0 rounded-xl border border-line bg-surface">
            <h2 className="border-b border-line px-5 py-4 font-semibold">{title}</h2>
            <div className="p-5">{children}</div>
        </section>
    );
}
