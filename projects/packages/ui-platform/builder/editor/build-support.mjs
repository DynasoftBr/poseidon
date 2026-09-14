import fs from 'node:fs/promises';
import { build } from 'esbuild';
const libraries = {};
async function collect(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
        const path = directory + '/' + entry.name;
        if (entry.isDirectory()) await collect(path);
        else if (/\.d\.(ts|mts)$|package\.json$/.test(path)) {
            libraries['file:///' + path] = await fs.readFile(path, 'utf8');
        }
    }
}
for (const name of [
    '@types/react',
    '@types/react-dom',
    'csstype',
    'react-router',
    'react-router-dom',
    'cookie',
    'tailwind-merge',
]) {
    await collect('node_modules/' + name);
}
libraries['file:///node_modules/@poseidon/ui/index.d.ts'] =
    "export { twMerge } from 'tailwind-merge';";
libraries['file:///node_modules/@poseidon/editor/index.d.ts'] = await fs.readFile(
    'editor/contract.d.ts',
    'utf8',
);
async function worker(entry) {
    const output = await build({
        entryPoints: [entry],
        bundle: true,
        write: false,
        format: 'iife',
        minify: true,
    });
    return output.outputFiles[0].text;
}
const workers = {
    typescript: await worker('editor/typescript-worker.mjs'),
    editor: await worker('node_modules/monaco-editor/esm/vs/editor/editor.worker.js'),
};
await fs.writeFile(
    'editor/support.js',
    'export const libraries = ' +
        JSON.stringify(libraries) +
        ';\nexport const workers = ' +
        JSON.stringify(workers) +
        ';',
);
