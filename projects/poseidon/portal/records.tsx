import { useEffect, useState } from 'react';
type Item = { id: string; version: number; createdAt: string; data: Record<string, unknown> };
export default function Records({
    kind,
    onEvent,
}: {
    kind: string;
    onEvent: (name: string, payload: object) => Promise<unknown>;
}) {
    const [items, setItems] = useState<Item[]>([]),
        [error, setError] = useState(''),
        [loading, setLoading] = useState(true);
    useEffect(() => {
        let active = true;
        setLoading(true);
        onEvent(kind === 'account' ? 'users' : kind, {})
            .then((value) => {
                if (active) setItems(value as Item[]);
            })
            .catch((reason) => {
                if (active) setError(String(reason));
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [kind]);
    if (loading) return <p role="status">Loading…</p>;
    return (
        <section>
            <h1 className="text-2xl font-semibold mb-6">
                {kind === 'users' ? 'Users' : kind === 'account' ? 'Account' : 'Published releases'}
            </h1>
            {error && <p role="alert">{error}</p>}
            {kind === 'account' ? (
                <div className="rounded-xl border border-line p-6">
                    <h2 className="font-semibold">Local development identity</h2>
                    <p className="text-muted my-3">
                        This prototype uses the server-owned system user. Authentication,
                        subscriptions and billing are not connected.
                    </p>
                    <pre className="whitespace-pre-wrap break-words text-sm">
                        {JSON.stringify(
                            items.find((item) => item.id === 'system')?.data || {},
                            null,
                            2,
                        )}
                    </pre>
                </div>
            ) : (
                <div
                    role="region"
                    aria-label="Records"
                    tabIndex={0}
                    className="overflow-x-auto rounded-xl border border-line"
                >
                    <table className="w-full min-w-96 text-left">
                        <thead>
                            <tr>
                                <th className="p-4">{kind === 'users' ? 'User' : 'Release'}</th>
                                <th className="p-4">Revision</th>
                                <th className="p-4">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-t border-line">
                                    <td className="p-4 break-all">
                                        {String(item.data.name || item.data.email || item.id)}
                                    </td>
                                    <td className="p-4">
                                        {item.version}
                                        {kind === 'releases' && (
                                            <button
                                                className="block min-h-11 text-primary"
                                                onClick={() =>
                                                    void onEvent('restore', { releaseId: item.id })
                                                        .then(() =>
                                                            setError(
                                                                'Release restored. Reload to use it.',
                                                            ),
                                                        )
                                                        .catch((reason) => setError(String(reason)))
                                                }
                                            >
                                                Restore release
                                            </button>
                                        )}
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        {new Date(item.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!items.length && <p className="p-5 text-muted">No records yet.</p>}
                </div>
            )}
        </section>
    );
}
