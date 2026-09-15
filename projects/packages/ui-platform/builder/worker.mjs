import process from 'node:process';
import { Scanner } from '@tailwindcss/oxide';
import postcss from 'postcss';
import fs from 'node:fs/promises';
import { build } from 'esbuild';
import ts from 'typescript';
import { compile } from '@tailwindcss/node';

async function run() {
    const snapshot = JSON.parse(await fs.readFile('/build/snapshot.json', 'utf8'));
    const components = new Map(snapshot.components.map((component) => [component._id, component]));
    const entry = await fs.readFile('/opt/builder/renderer.mjs', 'utf8');
    const result = await bundle(entry, components, snapshot.app.entryComponentId);
    const bundled = new Map(result.componentIds.map((id) => [id, components.get(id)]));
    validateImports(bundled);
    validateTypes(bundled);
    const candidates = new Scanner({}).scanFiles([
        ...[...bundled.values()].map((component) => ({
            content: component.source.code,
            extension: 'tsx',
        })),
        {
            content: await fs.readFile('/opt/builder/editor/code-editor.tsx', 'utf8'),
            extension: 'tsx',
        },
    ]);
    const themeIds = new Set(
        [...bundled.values()].flatMap((component) =>
            component.themeId ? [component.themeId] : [],
        ),
    );
    const themes = snapshot.themes
        .filter((theme) => themeIds.has(theme._id))
        .map((theme) => {
            if (!/^[a-zA-Z0-9_-]+$/.test(theme._id)) throw new Error('Invalid theme identifier');
            if (/@import|@theme|@plugin|@config|url\s*\(|<\/style/i.test(theme.source.code)) {
                throw new Error('Theme contains unsupported external content');
            }
            postcss.parse(theme.source.code, { from: theme._id });
            return `@scope ([data-theme="${theme._id}"]) to ([data-theme]) {${theme.source.code}}`;
        })
        .join('\n');
    const compiler = await compile(
        '@import "tailwindcss"; @theme inline { --color-canvas:var(--canvas); --color-surface:var(--surface); --color-ink:var(--ink); --color-muted:var(--muted); --color-line:var(--line); --color-primary:var(--primary); --color-selected:var(--selected); --color-primary-hover:var(--primary-hover); --color-danger:var(--danger); --color-accent:var(--accent); }' +
            themes,
        {
            base: '/opt/builder',
            onDependency() {},
        },
    );
    const css =
        compiler.build(candidates) +
        (result.outputFiles.find((file) => file.path.endsWith('.css'))?.text ?? '');
    const script = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
    await fs.writeFile(
        '/build/artifact.html',
        `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css.replace(/<\/style/gi, '')}</style></head><body><div id="root"></div><script>${script}</script></body></html>`,
    );
    await fs.writeFile('/build/manifest.json', JSON.stringify(result.componentIds));
}
try {
    await run();
} catch (error) {
    await fs.writeFile(
        '/build/error.json',
        JSON.stringify({ message: error instanceof Error ? error.message : 'Build failed' }),
    );
    process.exitCode = 1;
}

function validateImports(components) {
    const curated = new Set([
        'react',
        'react/jsx-runtime',
        'react-dom/client',
        'react-router-dom',
        '@poseidon/ui',
        '@poseidon/editor',
    ]);
    const diagnostics = [];
    for (const component of components.values()) {
        const file = ts.createSourceFile(
            `${component._id}.tsx`,
            component.source.code,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TSX,
        );
        const allowed = (name) => curated.has(name) || name.startsWith('@components/');
        const visit = (node) => {
            if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
                const name = node.moduleSpecifier?.text;
                if (name && !allowed(name)) {
                    diagnostics.push(
                        `${component._id}:${file.getLineAndCharacterOfPosition(node.pos).line + 1}: Import not declared: ${name}`,
                    );
                }
            }
            if (
                ts.isCallExpression(node) &&
                (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
                    node.expression.getText(file) === 'require')
            ) {
                diagnostics.push(`${component._id}: Dynamic imports and require are unavailable.`);
            }
            ts.forEachChild(node, visit);
        };
        visit(file);
    }
    if (diagnostics.length) throw new Error(diagnostics.join('\n'));
}
function validateTypes(components) {
    const sourceFiles = new Map(
        [...components.values()].map((component, index) => [
            `/opt/builder/component-${index}.tsx`,
            component,
        ]),
    );
    const options = {
        strict: true,
        noEmit: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        skipLibCheck: true,
    };
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (name, languageVersion, ...rest) =>
        sourceFiles.has(name)
            ? ts.createSourceFile(
                  name,
                  sourceFiles.get(name).source.code,
                  languageVersion,
                  true,
                  ts.ScriptKind.TSX,
              )
            : getSourceFile(name, languageVersion, ...rest);
    host.resolveModuleNames = (names, containingFile) =>
        names.map((name) => {
            const helper = resolveHelper(name);
            if (helper) return helper;
            const record = [...sourceFiles].find(
                ([, component]) => name === '@components/' + component._id,
            );
            return record
                ? { resolvedFileName: record[0], extension: ts.Extension.Tsx }
                : ts.resolveModuleName(name, containingFile, options, ts.sys).resolvedModule;
        });
    const program = ts.createProgram([...sourceFiles.keys()], options, host);
    const typeErrors = ts.getPreEmitDiagnostics(program);
    if (typeErrors.length) {
        throw new Error(
            typeErrors
                .map((error) => {
                    const component = error.file && sourceFiles.get(error.file.fileName);
                    const line = error.file
                        ? error.file.getLineAndCharacterOfPosition(error.start ?? 0).line + 1
                        : 0;
                    return `${component?._id ?? 'build'}:${line}: ${ts.flattenDiagnosticMessageText(error.messageText, ' ')}`;
                })
                .join('\n'),
        );
    }
}
async function bundle(entry, components, entryComponentId) {
    const componentIds = new Set();
    const result = await build({
        stdin: { contents: entry, resolveDir: '/opt/builder', loader: 'tsx' },
        bundle: true,
        write: false,
        format: 'iife',
        outfile: '/build/app.js',
        loader: { '.ttf': 'dataurl' },
        jsx: 'automatic',
        plugins: [
            {
                name: 'components',
                setup(builder) {
                    builder.onResolve({ filter: /^@poseidon\/entry$/ }, () => ({
                        path: entryComponentId,
                        namespace: 'component',
                    }));
                    builder.onResolve({ filter: /^@poseidon\/editor$/ }, () => ({
                        path: '/opt/builder/editor/code-editor.tsx',
                    }));
                    builder.onResolve({ filter: /^@poseidon\/ui$/ }, () => ({
                        path: '/opt/builder/ui-helpers.ts',
                    }));
                    builder.onResolve({ filter: /^@components\// }, (args) => ({
                        path: args.path.slice(12),
                        namespace: 'component',
                    }));
                    builder.onResolve({ filter: /^poseidon-raw:/ }, (args) => ({
                        path: args.path.slice(13),
                        namespace: 'raw',
                    }));
                    builder.onLoad({ filter: /.*/, namespace: 'component' }, (args) => {
                        const component = components.get(args.path);
                        if (!component) throw new Error(`Missing component: ${args.path}`);
                        componentIds.add(args.path);
                        return {
                            contents: component.themeId
                                ? `import React from 'react';import Component from ${JSON.stringify('poseidon-raw:' + args.path)};export * from ${JSON.stringify('poseidon-raw:' + args.path)};export default props=>React.createElement('div',{'data-theme':${JSON.stringify(component.themeId)},style:{display:'contents'}},React.createElement(Component,props));`
                                : `export {default} from ${JSON.stringify('poseidon-raw:' + args.path)};export * from ${JSON.stringify('poseidon-raw:' + args.path)}`,
                            loader: 'tsx',
                            resolveDir: '/opt/builder',
                        };
                    });
                    builder.onLoad({ filter: /.*/, namespace: 'raw' }, (args) => {
                        const component = components.get(args.path);
                        if (!component) throw new Error(`Missing component ${args.path}`);
                        return {
                            contents: component.source.code,
                            loader: 'tsx',
                            resolveDir: '/opt/builder',
                        };
                    });
                },
            },
        ],
    });
    return { ...result, componentIds: [...componentIds] };
}

function resolveHelper(name) {
    if (name === '@poseidon/editor') {
        return {
            resolvedFileName: '/opt/builder/editor/contract.d.ts',
            extension: ts.Extension.Dts,
        };
    }
    if (name === '@poseidon/ui') {
        return { resolvedFileName: '/opt/builder/ui-helpers.ts', extension: ts.Extension.Ts };
    }
    return undefined;
}
