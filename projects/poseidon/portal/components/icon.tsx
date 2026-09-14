export default function Icon({ name, label }: { name: 'menu' | 'plus' | 'arrow'; label?: string }) {
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
