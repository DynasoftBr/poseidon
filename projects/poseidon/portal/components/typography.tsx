import type { ReactNode } from 'react';

export default function Typography({
    as: Tag = 'p',
    children,
}: {
    as?: 'h1' | 'h2' | 'h3' | 'p';
    children: ReactNode;
}) {
    return (
        <Tag
            className={
                Tag === 'h1'
                    ? 'text-3xl font-semibold'
                    : Tag === 'p'
                      ? 'text-base'
                      : 'text-xl font-semibold'
            }
        >
            {children}
        </Tag>
    );
}
