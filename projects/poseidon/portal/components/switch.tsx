export default function Switch({
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
