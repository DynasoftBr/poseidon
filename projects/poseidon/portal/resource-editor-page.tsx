import { useEffect, useMemo, useRef, useState } from 'react';
import SourceEditor from '@components/source-editor';
import Header from '@components/portal-header';
import Sidebar from '@components/portal-sidebar';
import VisualEditor from '@components/visual-editor';

type Item = { id: string; version: number; data: Record<string, unknown> };
type Conversation = { id: string; data: { title?: string } };
type Props = {
    kind: string;
    onEvent: (name: string, payload: object) => Promise<unknown>;
    triton?: {
        history: Conversation[];
        messages: { role: string; text: string }[];
        prompt: string;
        setPrompt: (value: string) => void;
        send: () => Promise<void>;
    };
};
type SaveState = { state: 'saving' | 'saved' | 'error'; message?: string };

export default function ResourceEditorPage({ kind, onEvent, triton }: Props) {
    const [items, setItems] = useState<Item[]>([]);
    const [selected, setSelected] = useState<Item>();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [status, setStatus] = useState('');
    const [saveState, setSaveState] = useState<SaveState>();
    const [busy, setBusy] = useState(false);
    const [filesOpen, setFilesOpen] = useState(false);
    const [filesVisible, setFilesVisible] = useState(true);
    const [tritonOpen, setTritonOpen] = useState(true);
    const [problemsOpen, setProblemsOpen] = useState(false);
    const [diagnosticLine, setDiagnosticLine] = useState<number>();
    const [view, setView] = useState<'visual' | 'code'>('code');
    const savedSignature = useRef('');
    const files = useMemo(
        () => items.map((item) => ({ id: item.id, code: sourceOf(item) })),
        [items],
    );

    async function load() {
        setItems((await onEvent(kind, {})) as Item[]);
    }
    useEffect(() => {
        setSelected(undefined);
        setEditing(false);
        setStatus('');
        setSaveState(undefined);
        setItems([]);
        void load().catch((reason) => setStatus(String(reason)));
    }, [kind]);
    function choose(item: Item) {
        setDiagnosticLine(undefined);
        setSelected(item);
        setEditing(true);
        setFilesOpen(false);
        const nextName = String(item.data.name || '');
        const nextCode = sourceOf(item);
        savedSignature.current = signature(nextName, nextCode);
        setName(nextName);
        setCode(nextCode);
        setStatus('');
        setSaveState(undefined);
        setView('code');
    }
    function create() {
        setSelected(undefined);
        setEditing(true);
        setFilesOpen(false);
        const nextName = kind === 'components' ? 'New component' : 'New theme';
        const nextCode =
            kind === 'components'
                ? 'export default function Component(){return <div>Hello</div>}'
                : ':scope { --primary: #6366f1; }';
        savedSignature.current = '';
        setName(nextName);
        setCode(nextCode);
        setStatus('');
        setSaveState({ state: 'saving' });
        if (kind === 'components') setView('visual');
    }
    useEffect(() => {
        if (!editing || signature(name, code) === savedSignature.current) return;
        const timer = window.setTimeout(() => void save(), 1000);
        return () => window.clearTimeout(timer);
    }, [name, code, editing, selected?.id, selected?.version]);
    async function save() {
        const savingSignature = signature(name, code);
        setBusy(true);
        setSaveState({ state: 'saving' });
        try {
            const result = (await onEvent((selected ? 'update' : 'create') + kind, {
                ...(selected ? { id: selected.id, expectedVersion: selected.version } : {}),
                data: { name, source: { code } },
            })) as Item;
            savedSignature.current = savingSignature;
            setSelected(result);
            setItems((current) => {
                const exists = current.some((item) => item.id === result.id);
                return exists
                    ? current.map((item) => (item.id === result.id ? result : item))
                    : [...current, result];
            });
            setSaveState({ state: 'saved' });
        } catch (reason) {
            setSaveState({ state: 'error', message: String(reason) });
        } finally {
            setBusy(false);
        }
    }
    async function build(preview: boolean) {
        setBusy(true);
        setStatus('Building the component tree…');
        try {
            await onEvent(
                preview ? 'preview' : 'publish',
                preview
                    ? kind === 'components'
                        ? { componentId: selected?.id, props: {} }
                        : { themeId: selected?.id, props: {} }
                    : {},
            );
            setStatus(
                preview ? 'Preview built.' : 'Release published. Reload to use the new version.',
            );
        } catch (reason) {
            setStatus(String(reason));
        } finally {
            setBusy(false);
        }
    }
    function openDiagnostic(id: string, line: number) {
        const item = items.find((candidate) => candidate.id === id);
        if (!item) return;
        choose(item);
        setDiagnosticLine(line);
    }
    const statusContent = status ? (
        <div className="min-w-0">
            <pre role="status" className="whitespace-pre-wrap break-words">
                {status}
            </pre>
            {Array.from(status.matchAll(/([a-z0-9-]+):(\d+):/g))
                .filter((match) => items.some((item) => item.id === match[1]))
                .map((match, index) => (
                    <button
                        key={index}
                        className="min-h-11 text-primary underline mr-3"
                        onClick={() => openDiagnostic(match[1], Number(match[2]))}
                    >
                        Open {match[1]} at line {match[2]}
                    </button>
                ))}
        </div>
    ) : undefined;
    return (
        <section className="h-full min-h-0 flex flex-col overflow-hidden bg-canvas">
            <Header className="h-10 shrink-0 gap-2 bg-canvas px-2 py-0">
                <button
                    className="md:hidden h-9 px-2"
                    aria-label="Toggle component list"
                    aria-expanded={filesOpen}
                    onClick={() => setFilesOpen(!filesOpen)}
                >
                    ☰
                </button>
                <h1 className="font-semibold text-base truncate flex-1">
                    {kind === 'components' ? 'Components' : 'Themes'}
                </h1>
                <button className="h-9 px-2 text-sm text-primary shrink-0" onClick={create}>
                    Create new
                </button>
                {kind === 'components' && (
                    <div className="flex items-center gap-1 border-l border-line pl-2">
                        <LayoutButton
                            label={filesVisible ? 'Hide component list' : 'Show component list'}
                            active={filesVisible}
                            side="left"
                            onClick={() => setFilesVisible(!filesVisible)}
                        />
                        <LayoutButton
                            label={problemsOpen ? 'Hide problems panel' : 'Show problems panel'}
                            active={problemsOpen}
                            side="bottom"
                            disabled={!editing}
                            onClick={() => setProblemsOpen(!problemsOpen)}
                        />
                        <LayoutButton
                            label={tritonOpen ? 'Close Triton' : 'Open Triton'}
                            active={tritonOpen}
                            side="right"
                            onClick={() => setTritonOpen(!tritonOpen)}
                        />
                    </div>
                )}
            </Header>
            <div className="flex flex-1 min-h-0 min-w-0 relative">
                {filesOpen && (
                    <button
                        className="absolute inset-0 z-10 bg-black/30 md:hidden"
                        aria-label="Close component list"
                        onClick={() => setFilesOpen(false)}
                    />
                )}
                <Sidebar
                    element="nav"
                    aria-label="Component files"
                    className={
                        (filesOpen ? 'flex' : 'hidden') +
                        (filesVisible ? ' md:flex' : ' md:hidden') +
                        ' flex-col w-52 shrink-0 border-r border-line bg-surface absolute md:static inset-y-0 left-0 z-20'
                    }
                >
                    <div className="text-xs uppercase tracking-wide text-muted px-4 py-3">
                        {kind === 'components' ? 'Components' : 'Themes'}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto p-1">
                        {items.map((item) => (
                            <button
                                key={item.id}
                                title={String(item.data.name)}
                                aria-current={item.id === selected?.id ? 'page' : undefined}
                                className={
                                    'block w-full min-h-11 px-3 text-sm text-left truncate rounded ' +
                                    (item.id === selected?.id
                                        ? 'bg-selected text-primary'
                                        : 'hover:bg-selected')
                                }
                                onClick={() => choose(item)}
                            >
                                {String(item.data.name)} →
                            </button>
                        ))}
                    </div>
                    <div className="border-t border-line px-4 py-2 text-xs text-muted">
                        {items.length} {kind === 'components' ? 'components' : 'themes'}
                    </div>
                </Sidebar>
                <div className="flex-1 min-w-0 min-h-0 flex flex-col">
                    {editing ? (
                        <>
                            <div className="shrink-0 border-b border-line px-3 py-1 flex gap-2 items-center overflow-x-auto">
                                <input
                                    aria-label="Name"
                                    className="bg-transparent min-h-11 w-40 shrink-0 px-1 text-sm font-medium"
                                    value={name}
                                    onChange={(event) => {
                                        setName(event.target.value);
                                        setSaveState({ state: 'saving' });
                                    }}
                                />
                                {selected && (
                                    <span className="text-xs text-muted shrink-0">
                                        v{selected.version}
                                    </span>
                                )}
                                {kind === 'components' && selected && (
                                    <span className="text-xs text-muted shrink-0 mr-auto">
                                        {count(selected, 'props')} props ·{' '}
                                        {count(selected, 'events')} events
                                    </span>
                                )}
                                {kind === 'components' && (
                                    <div className="flex shrink-0 rounded-md border border-line p-0.5">
                                        <button
                                            className={
                                                'min-h-9 rounded px-3 text-sm ' +
                                                (view === 'visual'
                                                    ? 'bg-selected text-primary'
                                                    : '')
                                            }
                                            aria-pressed={view === 'visual'}
                                            onClick={() => setView('visual')}
                                        >
                                            Visual
                                        </button>
                                        <button
                                            className={
                                                'min-h-9 rounded px-3 text-sm ' +
                                                (view === 'code' ? 'bg-selected text-primary' : '')
                                            }
                                            aria-pressed={view === 'code'}
                                            onClick={() => setView('code')}
                                        >
                                            Code
                                        </button>
                                    </div>
                                )}
                                <button
                                    className="min-h-11 px-3 shrink-0 text-sm disabled:opacity-50"
                                    disabled={busy || !selected}
                                    onClick={() => void build(true)}
                                >
                                    Preview
                                </button>
                                <button
                                    className="min-h-11 px-3 shrink-0 text-sm disabled:opacity-50"
                                    disabled={busy}
                                    onClick={() => void build(false)}
                                >
                                    Publish Portal
                                </button>
                            </div>
                            <div className="flex-1 min-h-0 min-w-0 flex flex-col">
                                {kind === 'components' && view === 'visual' ? (
                                    <>
                                        <VisualEditor
                                            fileId={selected?.id || 'new-component'}
                                            componentName={name}
                                            value={code}
                                            components={items.map((item) => ({
                                                id: item.id,
                                                data: {
                                                    name: String(item.data.name || item.id),
                                                    props:
                                                        item.data.props &&
                                                        typeof item.data.props === 'object'
                                                            ? (item.data.props as Record<
                                                                  string,
                                                                  {
                                                                      type?: string;
                                                                      required?: boolean;
                                                                  }
                                                              >)
                                                            : {},
                                                    events:
                                                        item.data.events &&
                                                        typeof item.data.events === 'object'
                                                            ? (item.data.events as Record<
                                                                  string,
                                                                  {
                                                                      type?: string;
                                                                      required?: boolean;
                                                                  }
                                                              >)
                                                            : {},
                                                },
                                            }))}
                                            onChange={(value) => {
                                                setCode(value);
                                                setSaveState({ state: 'saving' });
                                            }}
                                        />
                                        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-3 py-2 text-xs">
                                            {statusContent || <span>No problems reported</span>}
                                            <SaveIndicator saveState={saveState} />
                                        </div>
                                    </>
                                ) : kind === 'components' ? (
                                    <SourceEditor
                                        fileId={selected?.id || 'new-component'}
                                        value={code}
                                        files={files}
                                        onChange={(value) => {
                                            setCode(value);
                                            setSaveState({ state: 'saving' });
                                        }}
                                        line={diagnosticLine}
                                        saveState={saveState}
                                        status={statusContent}
                                        problemsOpen={problemsOpen}
                                        onProblemsOpenChange={setProblemsOpen}
                                    />
                                ) : (
                                    <>
                                        <textarea
                                            aria-label="Source code"
                                            className="flex-1 min-h-0 resize-none bg-transparent p-4 font-mono text-sm"
                                            value={code}
                                            onChange={(event) => {
                                                setCode(event.target.value);
                                                setSaveState({ state: 'saving' });
                                            }}
                                        />
                                        <div className="shrink-0 max-h-40 overflow-auto border-t border-line px-3 py-2 text-xs flex items-center justify-between gap-3">
                                            {statusContent || <span>No problems reported</span>}
                                            <SaveIndicator saveState={saveState} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted p-6 text-center">
                            Select an item from the sidebar, or create a new one.
                        </div>
                    )}
                    {!editing && statusContent && (
                        <div className="shrink-0 max-h-40 overflow-auto border-t border-line px-3 py-2 text-xs">
                            {statusContent}
                        </div>
                    )}
                </div>
                {kind === 'components' && tritonOpen && triton && (
                    <TritonPanel triton={triton} onClose={() => setTritonOpen(false)} />
                )}
            </div>
        </section>
    );
}

function signature(name: string, code: string): string {
    return name + '\u0000' + code;
}

function SaveIndicator({ saveState }: { saveState?: SaveState }) {
    if (!saveState) return null;
    const label =
        saveState.state === 'saving'
            ? 'Saving'
            : saveState.state === 'saved'
              ? 'Saved'
              : 'Save failed';
    return (
        <span
            aria-label={label}
            title={saveState.message || label}
            className={
                saveState.state === 'saving'
                    ? 'size-4 animate-spin rounded-full border-2 border-muted border-t-primary'
                    : saveState.state === 'saved'
                      ? 'text-primary'
                      : 'text-danger'
            }
        >
            {saveState.state === 'saving' ? '' : saveState.state === 'saved' ? '✓' : 'ⓘ'}
        </span>
    );
}

function LayoutButton({
    label,
    side,
    active,
    disabled,
    onClick,
}: {
    label: string;
    side: 'left' | 'bottom' | 'right';
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className="size-8 grid place-items-center rounded hover:bg-selected disabled:opacity-35"
        >
            <span
                aria-hidden="true"
                className={
                    'block size-4 rounded-[2px] border border-muted ' +
                    (side === 'left'
                        ? 'border-l-[5px]'
                        : side === 'right'
                          ? 'border-r-[5px]'
                          : 'border-b-[5px]')
                }
            />
        </button>
    );
}

function TritonPanel({
    triton,
    onClose,
}: {
    triton: NonNullable<Props['triton']>;
    onClose: () => void;
}) {
    return (
        <Sidebar
            aria-label="Triton"
            className="absolute md:static inset-y-0 right-0 z-30 flex w-full max-w-80 shrink-0 flex-col border-l border-line bg-surface shadow-xl md:shadow-none"
        >
            <Header className="h-10 min-h-10 bg-surface px-2">
                <h2 className="text-sm font-medium flex-1">Triton</h2>
                <button
                    type="button"
                    aria-label="Close Triton"
                    title="Close Triton"
                    className="size-8 rounded hover:bg-selected"
                    onClick={onClose}
                >
                    ×
                </button>
            </Header>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {triton.messages.length > 0 ? (
                    <div className="space-y-3">
                        {triton.messages.map((message, index) => (
                            <div
                                key={index}
                                className={
                                    'rounded-lg p-3 text-sm ' +
                                    (message.role === 'user' ? 'bg-selected' : 'border border-line')
                                }
                            >
                                <div className="mb-1 text-xs text-muted">
                                    {message.role === 'user' ? 'You' : 'Triton · Simulated'}
                                </div>
                                <p className="break-words">{message.text}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <h3 className="mb-2 text-xs font-semibold uppercase text-muted">
                            Sessions
                        </h3>
                        {triton.history.length ? (
                            <div className="space-y-1">
                                {triton.history
                                    .slice(-6)
                                    .reverse()
                                    .map((item) => (
                                        <div key={item.id} className="rounded px-2 py-2 text-sm">
                                            <span className="mr-2 text-primary">●</span>
                                            {item.data.title}
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted">No conversations yet.</p>
                        )}
                    </>
                )}
            </div>
            <form
                className="m-3 rounded-xl border border-line p-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    void triton.send();
                }}
            >
                <textarea
                    aria-label="Message Triton"
                    placeholder="Describe what to build"
                    value={triton.prompt}
                    onChange={(event) => triton.setPrompt(event.target.value)}
                    className="min-h-20 w-full resize-none bg-transparent p-2 text-sm outline-none"
                />
                <div className="flex justify-end">
                    <button
                        type="submit"
                        aria-label="Send message"
                        disabled={!triton.prompt.trim()}
                        className="size-9 rounded-lg bg-primary text-white disabled:opacity-35"
                    >
                        ↑
                    </button>
                </div>
            </form>
        </Sidebar>
    );
}

function sourceOf(item: Item): string {
    const source = item.data.source;
    return source && typeof source === 'object' && 'code' in source ? String(source.code) : '';
}
function count(item: Item, field: 'props' | 'events'): number {
    const value = item.data[field];
    return value && typeof value === 'object' && !Array.isArray(value)
        ? Object.keys(value).length
        : 0;
}
