import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export default function Dialog({
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
            <div className="mb-5 flex items-center justify-between gap-4">
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
