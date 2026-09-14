export default function Icon({
    name,
    label,
}: {
    name: 'menu' | 'plus' | 'arrow' | 'ai';
    label?: string;
}) {
    const paths = {
        menu: 'M4 6h16M4 12h16M4 18h16',
        plus: 'M12 4v16M4 12h16',
        arrow: 'M5 12h14M12 5l7 7-7 7',
        ai: 'M12 3l1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1L6.5 8.5l4.1-1.4L12 3zM18.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2zM5.5 14l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z',
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
