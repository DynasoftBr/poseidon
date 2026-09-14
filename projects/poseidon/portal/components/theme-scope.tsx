import type { ReactNode } from 'react';

export default function ThemeScope({
    theme = 'default',
    children,
}: {
    theme?: string;
    children: ReactNode;
}) {
    return (
        <div data-theme={theme} className="contents">
            {children}
        </div>
    );
}
