import { useId, type ReactNode } from 'react';
import { useForm } from './form';
export function FormField({
    name,
    label,
    type = 'text',
}: {
    name: string;
    label: string;
    type?: 'text' | 'number' | 'email';
}) {
    const form = useForm(),
        id = useId();
    return (
        <label htmlFor={id} className="flex flex-col gap-2 text-sm">
            {label}
            <input
                id={id}
                type={type}
                value={String(form.values[name] ?? '')}
                aria-invalid={Boolean(form.errors[name])}
                aria-describedby={form.errors[name] ? id + '-error' : undefined}
                className="min-h-11 rounded-lg border border-line bg-surface px-3 text-base text-ink"
                onChange={(event) =>
                    form.setValue(
                        name,
                        type === 'number' && event.target.value !== ''
                            ? Number(event.target.value)
                            : event.target.value,
                    )
                }
            />
            {form.errors[name] && (
                <span id={id + '-error'} className="text-danger">
                    {form.errors[name]}
                </span>
            )}
        </label>
    );
}
export function FormStep({ active, children }: { active: boolean; children: ReactNode }) {
    return active ? <section>{children}</section> : null;
}
