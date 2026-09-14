import Button from '@components/ui-button';
import Dialog from '@components/ui-dialog';
import Field from '@components/ui-field';
import { useEffect, useState } from 'react';

type Item = { id: string; version: number; data: Record<string, unknown> };

export default function IdentityEditor({
    onEvent,
}: {
    onEvent: (name: string, payload: object) => Promise<unknown>;
}) {
    const [identities, setIdentities] = useState<Item[]>([]);
    const [users, setUsers] = useState<Item[]>([]);
    const [relationLinks, setRelationLinks] = useState<Item[]>([]);
    const [selected, setSelected] = useState<Item>();
    const [name, setName] = useState('');
    const [owner, setOwner] = useState('');
    const [members, setMembers] = useState<string[]>([]);
    const [memberOf, setMemberOf] = useState<string[]>([]);
    const [status, setStatus] = useState('');
    const [busy, setBusy] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [picker, setPicker] = useState<'members' | 'memberOf'>();

    async function load() {
        const [identityRecords, userRecords, linkRecords] = await Promise.all([
            onEvent('identities', {}),
            onEvent('users', {}),
            onEvent('identityrelations', {}),
        ]);
        const records = identityRecords as Item[];
        const links = linkRecords as Item[];
        setIdentities(records);
        setUsers(userRecords as Item[]);
        setRelationLinks(links);
        return { records, links };
    }

    useEffect(() => {
        void load().catch((reason) => setStatus(String(reason)));
    }, []);

    function choose(identity: Item, links = relationLinks) {
        setSelected(identity);
        setName(String(identity.data.name || ''));
        setOwner(String(identity.data.owner || ''));
        setMembers(linkedIds(identity.id, 'identity:members', links));
        setMemberOf(linkedIds(identity.id, 'identity:memberOf', links));
        setStatus('');
    }

    function create() {
        setSelected({ id: crypto.randomUUID(), version: 0, data: {} });
        setName('');
        setOwner(users[0]?.id || '');
        setMembers([]);
        setMemberOf([]);
        setStatus('');
    }

    async function save() {
        if (!selected) return;
        setBusy(true);
        try {
            const result = (await onEvent(
                selected.version ? 'updateidentities' : 'createidentities',
                {
                    id: selected.id,
                    ...(selected.version ? { expectedVersion: selected.version } : {}),
                    data: {
                        name,
                        owner,
                        members,
                        memberOf: selected.version ? ids(selected.data.memberOf) : [],
                    },
                },
            )) as Item;
            await updateParents(selected.id, memberOf, identities, onEvent);
            const loaded = await load();
            choose(
                loaded.records.find((identity) => identity.id === result.id) || result,
                loaded.links,
            );
            setStatus('Identity saved.');
        } catch (reason) {
            setStatus(String(reason));
        } finally {
            setBusy(false);
        }
    }

    async function remove() {
        if (!selected?.version) return;
        setBusy(true);
        try {
            await onEvent('deleteidentities', {
                id: selected.id,
                expectedVersion: selected.version,
                data: {},
            });
            setConfirmingDelete(false);
            setSelected(undefined);
            await load();
            setStatus('Identity deleted.');
        } catch (reason) {
            setStatus(String(reason));
        } finally {
            setBusy(false);
        }
    }

    const identityNames = new Map(
        identities.map((identity) => [identity.id, String(identity.data.name || identity.id)]),
    );
    const chosenIds = picker === 'members' ? members : memberOf;
    const availableIdentities = identities.filter(
        (identity) => identity.id !== selected?.id && !chosenIds.includes(identity.id),
    );
    return (
        <section>
            <div className="mb-6 flex items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold">Identities</h1>
                <Button variant="primary" onClick={create}>
                    Create identity
                </Button>
            </div>
            <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                <nav aria-label="Identities" className="flex gap-2 overflow-auto lg:flex-col">
                    {identities.map((identity) => (
                        <button
                            key={identity.id}
                            className="min-h-11 shrink-0 rounded-lg p-3 text-left hover:bg-selected"
                            onClick={() => choose(identity)}
                        >
                            {String(identity.data.name || identity.id)} →
                        </button>
                    ))}
                    {!identities.length && <p className="p-3 text-sm text-muted">No identities.</p>}
                </nav>
                {selected ? (
                    <form
                        className="min-w-0 space-y-5"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void save();
                        }}
                    >
                        <Field label="Name">
                            <input
                                required
                                aria-label="Identity name"
                                className="min-h-11 rounded-lg border border-line bg-surface px-3 py-2"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                            />
                        </Field>
                        <Field label="Owner">
                            <select
                                required
                                aria-label="Owner"
                                className="min-h-11 rounded-lg border border-line bg-surface px-3 py-2"
                                value={owner}
                                onChange={(event) => setOwner(event.target.value)}
                            >
                                <option value="">Choose an owner</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {String(user.data.name || user.data.login || user.id)}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <RelationshipList
                            title="Members"
                            description="Identities included in this identity."
                            ids={members}
                            names={identityNames}
                            onAdd={() => setPicker('members')}
                            onChange={setMembers}
                        />
                        <RelationshipList
                            title="Member of"
                            description="Parent identities whose access this identity inherits."
                            ids={memberOf}
                            names={identityNames}
                            onAdd={() => setPicker('memberOf')}
                            onChange={setMemberOf}
                        />
                        <div className="flex flex-wrap gap-3">
                            <Button type="submit" variant="primary" loading={busy}>
                                Save identity
                            </Button>
                            {selected.version > 0 && (
                                <Button
                                    variant="danger"
                                    disabled={busy}
                                    onClick={() => setConfirmingDelete(true)}
                                >
                                    Delete identity
                                </Button>
                            )}
                        </div>
                        {status && (
                            <p role="status" className="whitespace-pre-wrap break-words">
                                {status}
                            </p>
                        )}
                    </form>
                ) : (
                    <div>
                        <p className="text-muted">Choose an identity or create a new one.</p>
                        {status && (
                            <p role="status" className="mt-4 whitespace-pre-wrap break-words">
                                {status}
                            </p>
                        )}
                    </div>
                )}
            </div>
            <Dialog
                open={confirmingDelete}
                title="Delete identity?"
                onClose={() => setConfirmingDelete(false)}
            >
                <p className="mb-5">
                    Delete <strong>{name}</strong>? This cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                    <Button onClick={() => setConfirmingDelete(false)}>Cancel</Button>
                    <Button variant="danger" loading={busy} onClick={() => void remove()}>
                        Delete identity
                    </Button>
                </div>
            </Dialog>
            <Dialog
                open={picker !== undefined}
                title={picker === 'memberOf' ? 'Add parent identity' : 'Add member'}
                onClose={() => setPicker(undefined)}
            >
                <div className="space-y-2">
                    {availableIdentities.map((identity) => (
                        <button
                            key={identity.id}
                            type="button"
                            className="flex min-h-11 w-full items-center rounded-lg px-3 text-left hover:bg-selected"
                            onClick={() => {
                                if (picker === 'members') setMembers([...members, identity.id]);
                                if (picker === 'memberOf') setMemberOf([...memberOf, identity.id]);
                                setPicker(undefined);
                            }}
                        >
                            {String(identity.data.name || identity.id)}
                        </button>
                    ))}
                    {!availableIdentities.length && (
                        <p className="text-sm text-muted">No identities available.</p>
                    )}
                </div>
            </Dialog>
        </section>
    );
}

function RelationshipList({
    title,
    description,
    ids,
    names,
    onAdd,
    onChange,
}: {
    title: string;
    description: string;
    ids: string[];
    names: Map<string, string>;
    onAdd: () => void;
    onChange: (ids: string[]) => void;
}) {
    return (
        <section className="rounded-xl border border-line p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="font-semibold">{title}</h2>
                    <p className="text-sm text-muted">{description}</p>
                </div>
                <Button
                    aria-label={title === 'Members' ? 'Add member' : 'Add parent identity'}
                    onClick={onAdd}
                >
                    Add
                </Button>
            </div>
            <ul aria-label={title} className="mt-3 divide-y divide-line">
                {ids.map((id) => (
                    <li key={id} className="flex min-h-11 items-center justify-between gap-3 py-2">
                        <span>{names.get(id) || id}</span>
                        <Button
                            variant="ghost"
                            aria-label={`Remove ${names.get(id) || id} from ${title}`}
                            onClick={() => onChange(ids.filter((selectedId) => selectedId !== id))}
                        >
                            Remove
                        </Button>
                    </li>
                ))}
                {!ids.length && <li className="py-3 text-sm text-muted">None.</li>}
            </ul>
        </section>
    );
}

function ids(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
}

function linkedIds(identityId: string, propertyId: string, links: Item[]): string[] {
    return links
        .filter(
            (link) =>
                link.data.relationPropertyId === propertyId && link.data.thisId === identityId,
        )
        .map((link) => String(link.data.thatId));
}

async function updateParents(
    identityId: string,
    desiredParentIds: string[],
    identities: Item[],
    onEvent: (name: string, payload: object) => Promise<unknown>,
) {
    for (const parent of identities.filter((identity) => identity.id !== identityId)) {
        const currentMembers = ids(parent.data.members);
        const shouldContainIdentity = desiredParentIds.includes(parent.id);
        if (currentMembers.includes(identityId) === shouldContainIdentity) continue;
        await onEvent('updateidentities', {
            id: parent.id,
            expectedVersion: parent.version,
            data: {
                ...parent.data,
                members: shouldContainIdentity
                    ? [...currentMembers, identityId]
                    : currentMembers.filter((id) => id !== identityId),
            },
        });
    }
}
