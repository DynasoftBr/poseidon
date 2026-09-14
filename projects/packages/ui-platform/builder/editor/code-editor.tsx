import { useEffect, useId, useRef, useState } from 'react';
import 'monaco-editor/esm/vs/editor/editor.all';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import { libraries, workers } from './support';
import type { CodeEditorProps } from './contract';
import { registerComponentCompletions } from './component-completions';

const uri = (id: string) =>
    monaco.Uri.parse('file:///components/' + encodeURIComponent(id) + '.tsx');
const defaults = monaco.languages.typescript.typescriptDefaults;
const urls = new Map<string, string>();
Object.assign(globalThis, {
    MonacoEnvironment: {
        getWorker(_moduleId: string, label: string) {
            const kind = label === 'typescript' || label === 'javascript' ? 'typescript' : 'editor';
            let url = urls.get(kind);
            if (!url) {
                url = URL.createObjectURL(new Blob([workers[kind]], { type: 'text/javascript' }));
                urls.set(kind, url);
            }
            return new Worker(url);
        },
    },
});
defaults.setCompilerOptions({
    strict: true,
    noEmit: true,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    esModuleInterop: true,
    skipLibCheck: true,
    baseUrl: 'file:///',
    paths: { '@components/*': ['components/*'] },
});
defaults.setEagerModelSync(true);
defaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });

export function CodeEditor({
    fileId,
    value,
    files,
    onChange,
    line,
    saveState,
    status,
    problemsOpen: controlledProblemsOpen,
    onProblemsOpenChange,
}: CodeEditorProps) {
    const [localProblemsOpen, setLocalProblemsOpen] = useState(false);
    const problemsOpen = controlledProblemsOpen ?? localProblemsOpen;
    function setProblemsOpen(open: boolean) {
        setLocalProblemsOpen(open);
        onProblemsOpenChange?.(open);
    }
    const drawerId = useId();
    const problemsToggle = useRef<HTMLButtonElement>(null);
    const container = useRef<HTMLDivElement>(null);
    const editor = useRef<monaco.editor.IStandaloneCodeEditor | undefined>(undefined);
    const models = useRef(new Map<string, monaco.editor.ITextModel>());
    const synchronizing = useRef(false);
    const change = useRef(onChange);
    change.current = onChange;
    const [problems, setProblems] = useState<monaco.editor.IMarker[]>([]);
    useEffect(() => {
        if (!container.current) return;
        defaults.setExtraLibs(
            Object.entries(libraries).map(([filePath, content]) => ({ filePath, content })),
        );
        const instance = monaco.editor.create(container.current, {
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            tabSize: 4,
            ariaLabel: 'Source code',
            fixedOverflowWidgets: true,
            padding: { top: 12 },
            quickSuggestions: { other: true, comments: false, strings: true },
        });
        const completions = registerComponentCompletions();
        editor.current = instance;
        const listener = instance.onDidChangeModelContent(() => {
            if (!synchronizing.current) change.current(instance.getValue());
        });
        const markers = monaco.editor.onDidChangeMarkers(() => {
            const model = instance.getModel();
            setProblems(
                model
                    ? monaco.editor
                          .getModelMarkers({ resource: model.uri })
                          .filter((marker) => marker.severity >= monaco.MarkerSeverity.Info)
                    : [],
            );
        });
        const mode = () =>
            monaco.editor.setTheme(
                container.current?.closest('[data-mode]')?.getAttribute('data-mode') === 'dark'
                    ? 'vs-dark'
                    : 'vs',
            );
        mode();
        const observer = new MutationObserver(mode);
        observer.observe(document.documentElement, {
            attributes: true,
            subtree: true,
            attributeFilter: ['data-mode'],
        });
        return () => {
            observer.disconnect();
            completions.dispose();
            listener.dispose();
            markers.dispose();
            instance.dispose();
            for (const model of models.current.values()) model.dispose();
            models.current.clear();
        };
    }, []);
    useEffect(() => {
        synchronizing.current = true;
        try {
            const available = new Set([...files.map((file) => file.id), fileId]);
            for (const [id, model] of models.current) {
                if (available.has(id)) continue;
                model.dispose();
                models.current.delete(id);
            }
            for (const file of [
                ...files.filter((file) => file.id !== fileId),
                { id: fileId, code: value },
            ]) {
                const path = uri(file.id);
                let model = models.current.get(file.id);
                if (!model) {
                    model = monaco.editor.createModel(file.code, 'typescript', path);
                    models.current.set(file.id, model);
                } else if (file.id !== fileId && model.getValue() !== file.code)
                    model.setValue(file.code);
            }
            const selected = models.current.get(fileId)!;
            editor.current?.setModel(selected);
            if (selected.getValue() !== value) selected.setValue(value);
            setProblems(
                monaco.editor
                    .getModelMarkers({ resource: selected.uri })
                    .filter((marker) => marker.severity >= monaco.MarkerSeverity.Info),
            );
        } finally {
            synchronizing.current = false;
        }
    }, [fileId, files]);
    useEffect(() => {
        const model = editor.current?.getModel();
        if (model && model.getValue() !== value) {
            synchronizing.current = true;
            try {
                model.setValue(value);
            } finally {
                synchronizing.current = false;
            }
        }
    }, [value]);
    useEffect(() => {
        if (line) {
            editor.current?.revealLineInCenter(line);
            editor.current?.setPosition({ lineNumber: line, column: 1 });
            editor.current?.focus();
        }
    }, [fileId, line]);
    return (
        <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
            <div ref={container} className="flex-1 min-h-0 w-full" />
            <section
                id={drawerId}
                aria-label="Problems drawer"
                style={{ display: problemsOpen ? undefined : 'none' }}
                className="shrink-0 h-52 max-h-[50%] min-h-0 border-t border-line flex flex-col text-xs"
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        setProblemsOpen(false);
                        problemsToggle.current?.focus();
                    }
                }}
            >
                <div className="flex items-center justify-between px-3 py-2 border-b border-line">
                    <span className="font-medium">Problems · {problems.length}</span>
                    <button
                        aria-label="Close problems"
                        className="px-1 hover:bg-selected rounded"
                        onClick={() => {
                            setProblemsOpen(false);
                            problemsToggle.current?.focus();
                        }}
                    >
                        ×
                    </button>
                </div>
                <div aria-label="Code problems" className="min-h-0 overflow-auto px-3 py-2">
                    {status || (!problems.length && <span>No problems reported</span>)}
                    {problems.map((problem, index) => (
                        <button
                            key={index}
                            className="block w-full text-left py-2 hover:bg-selected"
                            onClick={() => {
                                editor.current?.setPosition({
                                    lineNumber: problem.startLineNumber,
                                    column: problem.startColumn,
                                });
                                editor.current?.revealLineInCenter(problem.startLineNumber);
                                editor.current?.focus();
                            }}
                        >
                            <span
                                className={
                                    problem.severity === monaco.MarkerSeverity.Error
                                        ? 'text-danger'
                                        : 'text-muted'
                                }
                            >
                                {problem.severity === monaco.MarkerSeverity.Error
                                    ? 'Error'
                                    : problem.severity === monaco.MarkerSeverity.Warning
                                      ? 'Warning'
                                      : 'Info'}
                            </span>{' '}
                            Line {problem.startLineNumber}: {problem.message}
                        </button>
                    ))}
                </div>
            </section>
            <div className="shrink-0 border-t border-line px-3 py-2 flex items-center justify-between gap-3 text-xs">
                <button
                    ref={problemsToggle}
                    aria-label={`Problems: ${problems.filter((p) => p.severity === monaco.MarkerSeverity.Error).length} errors, ${problems.filter((p) => p.severity === monaco.MarkerSeverity.Warning).length} warnings, ${problems.filter((p) => p.severity === monaco.MarkerSeverity.Info).length} information messages`}
                    aria-expanded={problemsOpen}
                    aria-controls={drawerId}
                    className={
                        '-my-1 inline-flex h-6 cursor-pointer items-center gap-2 rounded-md border px-2 shadow-sm transition duration-150 hover:border-primary hover:bg-selected hover:text-primary active:scale-95 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ' +
                        (problemsOpen
                            ? 'border-primary bg-selected text-primary'
                            : 'border-line bg-surface text-muted')
                    }
                    onClick={() => setProblemsOpen(!problemsOpen)}
                >
                    {[
                        monaco.MarkerSeverity.Error,
                        monaco.MarkerSeverity.Warning,
                        monaco.MarkerSeverity.Info,
                    ].map((severity) => (
                        <span
                            key={severity}
                            className="inline-flex items-center gap-1"
                            aria-hidden="true"
                        >
                            <svg
                                viewBox="0 0 16 16"
                                className="size-3"
                                fill="none"
                                stroke="currentColor"
                            >
                                {severity === monaco.MarkerSeverity.Warning ? (
                                    <path d="M8 1.5 15 14H1Z M8 5v4m0 2v1" />
                                ) : (
                                    <>
                                        <circle cx="8" cy="8" r="6" />
                                        <path
                                            d={
                                                severity === monaco.MarkerSeverity.Error
                                                    ? 'm5.5 5.5 5 5m0-5-5 5'
                                                    : 'M8 7v4m0-7v1'
                                            }
                                        />
                                    </>
                                )}
                            </svg>
                            {problems.filter((problem) => problem.severity === severity).length}
                        </span>
                    ))}
                </button>
                {saveState && <SaveIndicator {...saveState} />}
            </div>
        </div>
    );
}

function SaveIndicator({
    state,
    message,
}: {
    state: 'saving' | 'saved' | 'error';
    message?: string;
}) {
    const label = state === 'saving' ? 'Saving' : state === 'saved' ? 'Saved' : 'Save failed';
    if (state === 'saving') {
        return (
            <span
                aria-label={label}
                title={label}
                className="size-4 shrink-0 animate-spin rounded-full border-2 border-muted border-t-primary"
            />
        );
    }
    return (
        <span
            aria-label={label}
            title={message || label}
            className={state === 'saved' ? 'text-primary' : 'text-danger'}
        >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" fill="none">
                {state === 'saved' ? (
                    <path d="m4 10 4 4 8-9" stroke="currentColor" strokeWidth="2" />
                ) : (
                    <>
                        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                        <path d="M10 5v6m0 3v1" stroke="currentColor" strokeWidth="2" />
                    </>
                )}
            </svg>
        </span>
    );
}
