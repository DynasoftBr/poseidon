import { useEffect, useMemo, useState } from 'react';
import Button from '@components/ui-button';
import Sidebar from '@components/portal-sidebar';

type Schema = { type?: string; required?: boolean };
type ComponentItem = {
    id: string;
    name?: string;
    props?: Record<string, Schema>;
    events?: Record<string, Schema>;
};
type Node = {
    id: string;
    componentId: string;
    props: Record<string, string | number | boolean>;
    children: Node[];
};

const marker = /\/\* @poseidon-visual:([^ ]+) \*\//;

export default function VisualEditor({
    fileId,
    componentName,
    value,
    components,
    onChange,
}: {
    fileId: string;
    componentName: string;
    value: string;
    components: ComponentItem[];
    onChange: (value: string) => void;
}) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [selectedId, setSelectedId] = useState<string>();
    useEffect(() => {
        const tree = readTree(value);
        setNodes(tree);
        setSelectedId((current) => (findNode(tree, current) ? current : undefined));
        if (tree.length) {
            const generated = writeComponent(componentName, tree, components);
            if (generated !== value) onChange(generated);
        }
    }, [fileId]);
    const selected = useMemo(() => findNode(nodes, selectedId), [nodes, selectedId]);
    const definition = components.find((component) => component.id === selected?.componentId);
    const schemas =
        selected?.componentId === 'text'
            ? { text: { type: 'string' } }
            : selected?.componentId === 'container'
              ? { direction: { type: 'string' } }
              : definition?.props || {};

    function commit(next: Node[]) {
        setNodes(next);
        onChange(writeComponent(componentName, next, components));
    }
    function add(componentId: string, parentId?: string) {
        const node: Node = {
            id: crypto.randomUUID(),
            componentId,
            props:
                componentId === 'text'
                    ? { text: 'Your text' }
                    : componentId === 'container'
                      ? { direction: 'column' }
                      : {},
            children: [],
        };
        const next = parentId ? addChild(nodes, parentId, node) : [...nodes, node];
        setSelectedId(node.id);
        commit(next);
    }
    function updateProp(name: string, value: string | number | boolean) {
        if (!selected) return;
        commit(
            updateNode(nodes, selected.id, (node) => ({
                ...node,
                props: { ...node.props, [name]: value },
            })),
        );
    }
    function remove() {
        if (!selected) return;
        commit(removeNode(nodes, selected.id));
        setSelectedId(undefined);
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-canvas lg:flex-row">
            <Sidebar
                element="nav"
                aria-label="Component palette"
                className="max-h-44 w-full shrink-0 border-b border-line lg:max-h-none lg:w-48 lg:border-b-0 lg:border-r"
            >
                <div className="px-3 py-3 text-xs uppercase tracking-wide text-muted">
                    Add component
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-1">
                    <PaletteItem label="Container" componentId="container" onAdd={add} />
                    <PaletteItem label="Text" componentId="text" onAdd={add} />
                    {components
                        .filter((component) => component.id !== fileId)
                        .map((component) => (
                            <PaletteItem
                                key={component.id}
                                label={component.name || component.id}
                                componentId={component.id}
                                onAdd={add}
                            />
                        ))}
                </div>
            </Sidebar>
            <div
                className="min-h-72 min-w-0 flex-1 overflow-auto p-4 md:p-8"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                    event.preventDefault();
                    const componentId = event.dataTransfer.getData('text/component-id');
                    if (componentId) add(componentId);
                }}
            >
                <div className="mx-auto min-h-full max-w-4xl rounded-xl border border-dashed border-line bg-surface p-4">
                    {nodes.length ? (
                        <NodeList
                            nodes={nodes}
                            components={components}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            onAdd={add}
                        />
                    ) : (
                        <div className="grid min-h-64 place-items-center text-center text-sm text-muted">
                            <div>
                                <p className="font-medium text-ink">Build visually</p>
                                <p className="mt-1">
                                    Drag a component here or select one from the palette.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Sidebar
                aria-label="Component properties"
                className="max-h-64 w-full shrink-0 border-t border-line lg:max-h-none lg:w-64 lg:border-l lg:border-t-0"
            >
                <div className="border-b border-line px-3 py-3 text-xs uppercase tracking-wide text-muted">
                    Properties
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                    {selected ? (
                        <>
                            <p className="mb-4 truncate text-sm font-medium">
                                {componentLabel(selected.componentId, components)}
                            </p>
                            {Object.entries(schemas).map(([name, schema]) => (
                                <PropertyInput
                                    key={name}
                                    name={name}
                                    schema={schema}
                                    value={selected.props[name]}
                                    onChange={(value) => updateProp(name, value)}
                                />
                            ))}
                            {!Object.keys(schemas).length && (
                                <p className="text-sm text-muted">This component has no props.</p>
                            )}
                            <Button variant="ghost" className="mt-5 text-danger" onClick={remove}>
                                Remove component
                            </Button>
                        </>
                    ) : (
                        <p className="text-sm text-muted">Select a component to edit its props.</p>
                    )}
                </div>
            </Sidebar>
        </div>
    );
}

function PaletteItem({
    label,
    componentId,
    onAdd,
}: {
    label: string;
    componentId: string;
    onAdd: (componentId: string) => void;
}) {
    return (
        <button
            draggable
            className="block min-h-10 w-full truncate rounded px-3 text-left text-sm hover:bg-selected"
            onDragStart={(event) => event.dataTransfer.setData('text/component-id', componentId)}
            onClick={() => onAdd(componentId)}
        >
            {label}
        </button>
    );
}

function NodeList({
    nodes,
    components,
    selectedId,
    onSelect,
    onAdd,
}: {
    nodes: Node[];
    components: ComponentItem[];
    selectedId?: string;
    onSelect: (id: string) => void;
    onAdd: (componentId: string, parentId?: string) => void;
}) {
    return (
        <div className="space-y-2">
            {nodes.map((node) => (
                <div
                    key={node.id}
                    className={
                        'rounded-lg border p-3 ' +
                        (node.id === selectedId ? 'border-primary bg-selected' : 'border-line')
                    }
                    onClick={(event) => {
                        event.stopPropagation();
                        onSelect(node.id);
                    }}
                    onDragOver={(event) => {
                        if (node.componentId === 'container') event.preventDefault();
                    }}
                    onDrop={(event) => {
                        if (node.componentId !== 'container') return;
                        event.preventDefault();
                        event.stopPropagation();
                        const componentId = event.dataTransfer.getData('text/component-id');
                        if (componentId) onAdd(componentId, node.id);
                    }}
                >
                    <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">
                            {componentLabel(node.componentId, components)}
                        </span>
                        {node.componentId === 'text' && (
                            <span className="truncate text-muted">{String(node.props.text)}</span>
                        )}
                    </div>
                    {node.componentId === 'container' && (
                        <div className="mt-3 min-h-12 rounded border border-dashed border-line p-2">
                            {node.children.length ? (
                                <NodeList
                                    nodes={node.children}
                                    components={components}
                                    selectedId={selectedId}
                                    onSelect={onSelect}
                                    onAdd={onAdd}
                                />
                            ) : (
                                <p className="py-2 text-center text-xs text-muted">
                                    Drop components here
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function PropertyInput({
    name,
    schema,
    value,
    onChange,
}: {
    name: string;
    schema: Schema;
    value?: string | number | boolean;
    onChange: (value: string | number | boolean) => void;
}) {
    if (schema.type === 'boolean') {
        return (
            <label className="mb-3 flex min-h-10 items-center justify-between gap-3 text-sm">
                {name}
                <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(event) => onChange(event.target.checked)}
                />
            </label>
        );
    }
    return (
        <label className="mb-3 block text-sm">
            <span className="mb-1 block text-muted">
                {name}
                {schema.required ? ' *' : ''}
            </span>
            <input
                className="min-h-10 w-full rounded-md border border-line bg-canvas px-2"
                type={schema.type === 'number' ? 'number' : 'text'}
                value={value === undefined ? '' : String(value)}
                onChange={(event) =>
                    onChange(
                        schema.type === 'number' ? Number(event.target.value) : event.target.value,
                    )
                }
            />
        </label>
    );
}

function readTree(source: string): Node[] {
    const encoded = marker.exec(source)?.[1];
    if (!encoded) return [];
    try {
        return JSON.parse(decodeURIComponent(encoded)) as Node[];
    } catch {
        return [];
    }
}

function writeComponent(name: string, nodes: Node[], components: ComponentItem[]): string {
    const componentIds = [...new Set(flatten(nodes).map((node) => node.componentId))].filter(
        (id) => id !== 'container' && id !== 'text',
    );
    const aliases = componentAliases(componentIds, components, identifier(name || 'Component'));
    const imports = componentIds
        .map((id) => `import ${aliases.get(id)} from '@components/${id}';`)
        .join('\n');
    const component = identifier(name || 'Component');
    const encoded = encodeURIComponent(JSON.stringify(nodes));
    return `${imports}${imports ? '\n\n' : ''}/* @poseidon-visual:${encoded} */\nexport default function ${component}(){\n  return (\n    <div className="flex flex-col gap-4">\n${renderNodes(nodes, aliases, components, 6)}\n    </div>\n  );\n}\n`;
}

function componentAliases(
    componentIds: string[],
    components: ComponentItem[],
    componentName: string,
): Map<string, string> {
    const aliases = new Map<string, string>();
    const used = new Set([componentName]);
    for (const id of componentIds) {
        const storedName = components.find((component) => component.id === id)?.name || id;
        const base = identifier(storedName.replace(/^(ui|portal)-/i, ''));
        let alias = base;
        let suffix = 2;
        while (used.has(alias)) alias = `${base}${suffix++}`;
        aliases.set(id, alias);
        used.add(alias);
    }
    return aliases;
}

function renderNodes(
    nodes: Node[],
    aliases: Map<string, string>,
    components: ComponentItem[],
    indentation: number,
): string {
    return nodes
        .map((node) => {
            const spaces = ' '.repeat(indentation);
            if (node.componentId === 'text')
                return `${spaces}<p>${escapeText(String(node.props.text || ''))}</p>`;
            if (node.componentId === 'container') {
                const direction = node.props.direction === 'row' ? 'flex-row' : 'flex-col';
                return `${spaces}<div className="flex ${direction} gap-4">\n${renderNodes(node.children, aliases, components, indentation + 2)}\n${spaces}</div>`;
            }
            const properties = Object.entries(node.props)
                .map(([name, value]) => ` ${name}={${JSON.stringify(value)}}`)
                .join('');
            const events = Object.keys(
                components.find((component) => component.id === node.componentId)?.events || {},
            )
                .map((name) => ` ${name}={() => undefined}`)
                .join('');
            return `${spaces}<${aliases.get(node.componentId)}${properties}${events} />`;
        })
        .join('\n');
}

function flatten(nodes: Node[]): Node[] {
    return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

function findNode(nodes: Node[], id?: string): Node | undefined {
    if (!id) return undefined;
    for (const node of nodes) {
        if (node.id === id) return node;
        const nested = findNode(node.children, id);
        if (nested) return nested;
    }
    return undefined;
}

function addChild(nodes: Node[], parentId: string, child: Node): Node[] {
    return updateNode(nodes, parentId, (node) => ({
        ...node,
        children: [...node.children, child],
    }));
}

function updateNode(nodes: Node[], id: string, update: (node: Node) => Node): Node[] {
    return nodes.map((node) =>
        node.id === id
            ? update(node)
            : { ...node, children: updateNode(node.children, id, update) },
    );
}

function removeNode(nodes: Node[], id: string): Node[] {
    return nodes
        .filter((node) => node.id !== id)
        .map((node) => ({ ...node, children: removeNode(node.children, id) }));
}

function componentLabel(id: string, components: ComponentItem[]): string {
    if (id === 'container') return 'Container';
    if (id === 'text') return 'Text';
    return components.find((component) => component.id === id)?.name || id;
}

function identifier(value: string): string {
    const normalized = value.replace(/[^a-zA-Z0-9_$]+/g, ' ').trim();
    const result = normalized
        .split(/\s+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
    return /^[a-zA-Z_$]/.test(result) ? result : `Component${result}`;
}

function escapeText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
