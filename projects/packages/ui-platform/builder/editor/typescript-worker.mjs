import {
    initialize,
    TypeScriptWorker,
} from 'monaco-editor/esm/vs/language/typescript/ts.worker.js';
const ts = globalThis.ts;
const curated = new Set([
    'react',
    'react/jsx-runtime',
    'react-dom/client',
    'react-router-dom',
    '@poseidon/ui',
    '@poseidon/editor',
]);
class PoseidonWorker extends TypeScriptWorker {
    getComponentCompletions(fileName, position) {
        const preferences = {
            includeCompletionsForModuleExports: true,
            includeCompletionsWithInsertText: true,
            importModuleSpecifierPreference: 'non-relative',
        };
        const info = this._languageService.getCompletionsAtPosition(
            fileName,
            position,
            preferences,
        );
        return (info?.entries ?? [])
            .filter((entry) => entry.source?.startsWith('@components/'))
            .map((entry) => {
                const details = this._languageService.getCompletionEntryDetails(
                    fileName,
                    position,
                    entry.name,
                    ts.getDefaultFormatCodeSettings(),
                    entry.source,
                    preferences,
                    entry.data,
                );
                const changes = details?.codeActions?.flatMap((action) => action.changes) ?? [];
                return {
                    name: entry.name,
                    source: entry.source,
                    insertText: entry.insertText ?? entry.name,
                    span: entry.replacementSpan,
                    edits: changes
                        .filter((change) => change.fileName === fileName)
                        .flatMap((change) => change.textChanges),
                };
            });
    }

    async getSemanticDiagnostics(fileName) {
        const diagnostics = await super.getSemanticDiagnostics(fileName);
        const file = this._languageService.getProgram()?.getSourceFile(fileName);
        if (!file) return diagnostics;
        const report = (node, messageText) =>
            diagnostics.push({
                category: 1,
                code: 99001,
                start: node.getStart(file),
                length: node.getWidth(file),
                messageText,
            });
        const allowed = (name) => curated.has(name) || name.startsWith('@components/');
        const visit = (node) => {
            if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
                const name = node.moduleSpecifier?.text;
                if (name && !allowed(name)) {
                    report(node, 'Import not declared: ' + name);
                }
            }
            if (
                ts.isCallExpression(node) &&
                (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
                    node.expression.getText(file) === 'require')
            ) {
                report(node, 'Dynamic imports and require are unavailable.');
            }
            ts.forEachChild(node, visit);
        };
        visit(file);
        return diagnostics;
    }
}
globalThis.onmessage = () => initialize((context, data) => new PoseidonWorker(context, data));
