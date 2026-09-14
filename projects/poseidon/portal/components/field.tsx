import type { ReactNode } from 'react';

export default function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="flex min-w-0 flex-col gap-2 text-sm">
            {label}
            {children}
            {error && (
                <span role="alert" className="text-danger">
                    {error}
                </span>
            )}
        </label>
    );
}
