import { useEffect, useState } from 'react';
type Item = { id: string; version: number; data: Record<string, unknown> };
type Property = { id: string; version?: number; data: Record<string, unknown> };
const input = 'min-h-11 w-full rounded-lg border border-line bg-surface px-3 py-2';
export default function EntityTypeEditor({
    onEvent,
}: {
    onEvent: (name: string, payload: object) => Promise<unknown>;
}) {
    const [types, setTypes] = useState<Item[]>([]),
        [properties, setProperties] = useState<Item[]>([]),
        [selected, setSelected] = useState<Item>(),
        [name, setName] = useState(''),
        [fields, setFields] = useState<Property[]>([]),
        [actions, setActions] = useState('[]'),
        [status, setStatus] = useState(''),
        [busy, setBusy] = useState(false);
    async function load() {
        const values = await Promise.all([onEvent('entities', {}), onEvent('properties', {})]);
        setTypes(values[0] as Item[]);
        setProperties(values[1] as Item[]);
    }
    useEffect(() => {
        void load().catch((reason) => setStatus(String(reason)));
    }, []);
    function choose(item: Item) {
        setSelected(item);
        setName(String(item.data.name || ''));
        const ids = Array.isArray(item.data.properties) ? item.data.properties : [];
        setFields(properties.filter((field) => ids.includes(field.id)));
        setActions(JSON.stringify(item.data.commands || [], null, 2));
        setStatus('');
    }
    function create() {
        setSelected({ id: crypto.randomUUID(), version: 0, data: {} });
        setName('');
        setFields([]);
        setActions('[]');
        setStatus('');
    }
    function change(index: number, key: string, value: unknown) {
        setFields((current) =>
            current.map((field, i) =>
                i === index ? { ...field, data: { ...field.data, [key]: value } } : field,
            ),
        );
    }
    async function save() {
        if (!selected) return;
        setBusy(true);
        try {
            const data = {
                ...selected.data,
                name,
                ...(selected.version ? {} : { label: name }),
                commands: JSON.parse(actions) as unknown,
                properties: fields.map((field) => ({
                    id: field.id,
                    ...(field.version ? { expectedVersion: field.version } : {}),
                    data: { ...field.data, entityTypeId: selected.id },
                })),
            };
            const result = (await onEvent(selected.version ? 'updateentities' : 'createentities', {
                id: selected.id,
                ...(selected.version ? { expectedVersion: selected.version } : {}),
                data,
            })) as Item;
            await load();
            setSelected(result);
            setStatus('Entity type saved.');
            const refreshed = (await onEvent('properties', {})) as Item[];
            setFields(
                refreshed.filter(
                    (field) =>
                        Array.isArray(result.data.properties) &&
                        result.data.properties.includes(field.id),
                ),
            );
        } catch (reason) {
            setStatus(String(reason));
        } finally {
            setBusy(false);
        }
    }
    return (
        <section>
            <div className="flex items-center justify-between gap-3 mb-6">
                <h1 className="text-2xl font-semibold">Entity types</h1>
                <button className="min-h-11 px-4 rounded-lg bg-primary text-white" onClick={create}>
                    Create new
                </button>
            </div>
            <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-5">
                <nav className="flex lg:flex-col overflow-auto gap-2">
                    {types.map((item) => (
                        <button
                            key={item.id}
                            className="min-h-11 p-3 text-left rounded-lg hover:bg-selected shrink-0"
                            onClick={() => choose(item)}
                        >
                            {String(item.data.label || item.data.name)} →
                        </button>
                    ))}
                </nav>
                {selected ? (
                    <form
                        className="min-w-0"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void save();
                        }}
                    >
                        <label className="block mb-5">
                            Name
                            <input
                                aria-label="Entity name"
                                className={input + ' mt-2'}
                                required
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                            />
                        </label>
                        <h2 className="font-semibold mb-3">Properties and relationships</h2>
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <fieldset
                                    key={field.id}
                                    className="border border-line rounded-xl p-4"
                                >
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <label>
                                            Property name
                                            <input
                                                required
                                                className={input}
                                                value={String(field.data.name || '')}
                                                onChange={(event) =>
                                                    change(index, 'name', event.target.value)
                                                }
                                            />
                                        </label>
                                        <label>
                                            Type
                                            <select
                                                className={input}
                                                value={String(field.data.type || 'string')}
                                                onChange={(event) =>
                                                    change(index, 'type', event.target.value)
                                                }
                                            >
                                                {[
                                                    'string',
                                                    'number',
                                                    'integer',
                                                    'boolean',
                                                    'date-time',
                                                    'reference',
                                                    'array',
                                                    'object',
                                                    'json',
                                                ].map((type) => (
                                                    <option key={type}>{type}</option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                    <label className="flex min-h-11 items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(field.data.required)}
                                            onChange={(event) =>
                                                change(index, 'required', event.target.checked)
                                            }
                                        />
                                        Required
                                    </label>
                                    {field.data.type === 'reference' && (
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <label>
                                                Related entity type
                                                <select
                                                    required
                                                    className={input}
                                                    value={String(
                                                        field.data.relatedEntityTypeId || '',
                                                    )}
                                                    onChange={(event) =>
                                                        change(
                                                            index,
                                                            'relatedEntityTypeId',
                                                            event.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">Choose a type</option>
                                                    {types.map((type) => (
                                                        <option key={type.id} value={type.id}>
                                                            {String(type.data.name)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                Relationship
                                                <select
                                                    className={input}
                                                    value={String(
                                                        field.data.relationKind || 'belongs-to-one',
                                                    )}
                                                    onChange={(event) =>
                                                        change(
                                                            index,
                                                            'relationKind',
                                                            event.target.value,
                                                        )
                                                    }
                                                >
                                                    {[
                                                        'belongs-to-one',
                                                        'has-one',
                                                        'has-many',
                                                        'belongs-to-many',
                                                    ].map((value) => (
                                                        <option key={value}>{value}</option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                    )}
                                    <p className="text-xs text-muted break-all mt-2">
                                        Property ID: {field.id}
                                    </p>
                                    <button
                                        type="button"
                                        className="min-h-11 text-danger"
                                        onClick={() =>
                                            setFields((current) =>
                                                current.filter((item) => item.id !== field.id),
                                            )
                                        }
                                    >
                                        Remove property
                                    </button>
                                </fieldset>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="min-h-11 my-4 px-3 border border-line rounded-lg"
                            onClick={() =>
                                setFields((current) => [
                                    ...current,
                                    {
                                        id: crypto.randomUUID(),
                                        data: { name: '', type: 'string', required: false },
                                    },
                                ])
                            }
                        >
                            Add property
                        </button>
                        <label className="block mt-5 font-semibold">
                            Declarative actions
                            <textarea
                                aria-label="Declarative actions"
                                className={input + ' mt-3 min-h-40 font-mono text-sm'}
                                value={actions}
                                onChange={(event) => setActions(event.target.value)}
                            />
                        </label>
                        <p className="text-sm text-muted my-3">
                            Actions use the platform command format: operation, input property IDs,
                            specifications and consequences.
                        </p>
                        <button
                            disabled={busy}
                            className="min-h-11 px-4 rounded-lg bg-primary text-white disabled:opacity-50"
                        >
                            {busy ? 'Saving…' : 'Save entity type'}
                        </button>
                        {status && (
                            <p role="status" className="mt-4 whitespace-pre-wrap break-words">
                                {status}
                            </p>
                        )}
                    </form>
                ) : (
                    <p className="text-muted">
                        Choose an entity type to configure its properties, relationships and
                        actions.
                    </p>
                )}
            </div>
        </section>
    );
}
