import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

type Span = { start: number; length: number };
type ComponentCompletion = {
    name: string;
    source: string;
    insertText: string;
    span?: Span;
    edits: { span: Span; newText: string }[];
};
type ComponentWorker = monaco.languages.typescript.TypeScriptWorker & {
    getComponentCompletions(fileName: string, position: number): Promise<ComponentCompletion[]>;
};

export function registerComponentCompletions() {
    return monaco.languages.registerCompletionItemProvider('typescript', {
        triggerCharacters: ['"', "'", '/', '<'],
        async provideCompletionItems(model, position, _context, token) {
            const prefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
            const modulePath = prefix.match(/(?:\bfrom\s*|\bimport\s*)["']([^"']*)$/);
            if (modulePath) return { suggestions: importPaths(model, position, modulePath[1]) };
            const word = model.getWordUntilPosition(position);
            if (!word.word) return { suggestions: [] };
            const version = model.getVersionId();
            const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
            const worker = (await getWorker(model.uri)) as ComponentWorker;
            const entries = await worker.getComponentCompletions(
                model.uri.toString(),
                model.getOffsetAt(position),
            );
            if (
                token.isCancellationRequested ||
                model.isDisposed() ||
                model.getVersionId() !== version
            ) {
                return { suggestions: [] };
            }
            return {
                suggestions: entries.map((entry) => ({
                    label: { label: entry.name, description: entry.source },
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: entry.insertText,
                    range: entry.span
                        ? rangeOf(model, entry.span)
                        : new monaco.Range(
                              position.lineNumber,
                              word.startColumn,
                              position.lineNumber,
                              word.endColumn,
                          ),
                    additionalTextEdits: entry.edits.map((edit) => ({
                        range: rangeOf(model, edit.span),
                        text: edit.newText,
                    })),
                })),
            };
        },
    });
}

function importPaths(model: monaco.editor.ITextModel, position: monaco.Position, prefix: string) {
    return monaco.editor
        .getModels()
        .filter((candidate) => candidate !== model && candidate.uri.path.startsWith('/components/'))
        .map(
            (candidate) =>
                '@components/' +
                decodeURIComponent(
                    candidate.uri.path.slice('/components/'.length).replace(/\.tsx$/, ''),
                ),
        )
        .filter((name) => name.startsWith(prefix))
        .map((name) => ({
            label: name,
            kind: monaco.languages.CompletionItemKind.Module,
            insertText: name,
            range: new monaco.Range(
                position.lineNumber,
                position.column - prefix.length,
                position.lineNumber,
                position.column,
            ),
        }));
}

function rangeOf(model: monaco.editor.ITextModel, span: Span): monaco.Range {
    const start = model.getPositionAt(span.start);
    const end = model.getPositionAt(span.start + span.length);
    return new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column);
}
