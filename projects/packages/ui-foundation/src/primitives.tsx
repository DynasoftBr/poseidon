import { useEffect, useRef } from 'react';
import type {
    SelectHTMLAttributes,
    ButtonHTMLAttributes,
    HTMLAttributes,
    InputHTMLAttributes,
    ReactNode,
} from 'react';
import { twMerge } from 'tailwind-merge';

const buttonVariants = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'border border-line bg-surface text-ink hover:bg-selected',
    ghost: 'text-ink hover:bg-selected',
    danger: 'text-danger border border-line hover:bg-selected',
};
export function Button({
    variant = 'secondary',
    loading = false,
    className,
    children,
    disabled,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: keyof typeof buttonVariants;
    loading?: boolean;
}) {
    return (
        <button
            type="button"
            {...props}
            disabled={disabled || loading}
            aria-busy={loading}
            className={twMerge(
                'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50',
                buttonVariants[variant],
                className,
            )}
        >
            {loading ? 'Working…' : children}
        </button>
    );
}
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
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
export function Badge({ children }: { children: ReactNode }) {
    return <span className="rounded-md bg-selected px-2 py-1 text-xs text-accent">{children}</span>;
}
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className={twMerge(
                'min-h-11 w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink disabled:opacity-50',
                className,
            )}
        />
    );
}
export function Field({
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
export function Switch({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
            {label}
            <input
                type="checkbox"
                role="switch"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="size-5 accent-primary"
            />
        </label>
    );
}
export function Table({ children, label }: { children: ReactNode; label: string }) {
    return (
        <div role="region" aria-label={label} tabIndex={0} className="max-w-full overflow-x-auto">
            <table className="w-full min-w-120 text-left text-sm [&_td]:border-b [&_td]:border-line [&_td]:p-3 [&_th]:p-3 [&_th]:text-muted">
                {children}
            </table>
        </div>
    );
}
export function ThemeScope({
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

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props}
            className={twMerge(
                'min-h-11 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink',
                className,
            )}
        >
            {children}
        </select>
    );
}
export function Dialog({
    open,
    title,
    onClose,
    children,
}: {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        if (open && !dialog.current?.open) dialog.current?.showModal();
        if (!open && dialog.current?.open) dialog.current.close();
    }, [open]);
    return (
        <dialog
            ref={dialog}
            onCancel={onClose}
            aria-label={title}
            className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-line bg-surface p-6 text-ink backdrop:bg-black/50"
        >
            <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="text-xl font-semibold">{title}</h2>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="min-h-11 min-w-11 rounded-lg hover:bg-selected"
                >
                    ×
                </button>
            </div>
            {children}
        </dialog>
    );
}
export function Feedback({
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
export function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="min-w-0 rounded-xl border border-line bg-surface">
            <h2 className="border-b border-line px-5 py-4 font-semibold">{title}</h2>
            <div className="p-5">{children}</div>
        </section>
    );
}
export function Typography({
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
export function Icon({ name, label }: { name: 'menu' | 'plus' | 'arrow'; label?: string }) {
    const paths = {
        menu: 'M4 6h16M4 12h16M4 18h16',
        plus: 'M12 4v16M4 12h16',
        arrow: 'M5 12h14M12 5l7 7-7 7',
    };
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden={label ? undefined : true}
            role={label ? 'img' : undefined}
            aria-label={label}
        >
            <path d={paths[name]} />
        </svg>
    );
}
