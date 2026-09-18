import { execFile, spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

// Playwright requires global setup modules to have a default export.
// eslint-disable-next-line no-restricted-syntax
export default async function globalSetup(): Promise<() => Promise<void>> {
    const containerName = `poseidon-playwright-${process.pid}-${Date.now()}`;
    const artifactDirectory = await mkdtemp(resolve(tmpdir(), 'poseidon-playwright-'));
    const processes: ChildProcess[] = [];

    const teardown = async (): Promise<void> => {
        for (const child of processes.reverse()) stop(child);
        await exec('docker', ['rm', '--force', containerName]).catch(() => undefined);
        await rm(artifactDirectory, { recursive: true, force: true });
    };

    try {
        const mongoPort = await startMongo(containerName);

        processes.push(
            start('npm', ['run', 'dev', '--workspace', '@poseidon/server'], {
                MONGODB_URI: `mongodb://127.0.0.1:${mongoPort}/poseidon?replicaSet=rs0&directConnection=true`,
                POSEIDON_LOCAL_UI: 'true',
                POSEIDON_ARTIFACT_DIRECTORY: artifactDirectory,
                PORT: '3100',
                POSEIDON_RENDERER_PORT: '3101',
                POSEIDON_RENDERER_ORIGIN: 'http://renderer.localhost:3101',
                POSEIDON_CLIENT_ORIGIN: 'http://127.0.0.1:5174',
            }),
        );
        await waitForUrl('http://127.0.0.1:3100/health');

        processes.push(
            start('npm', ['run', 'dev', '--workspace', '@poseidon/client', '--', '--strictPort'], {
                POSEIDON_CLIENT_PORT: '5174',
                POSEIDON_API_URL: 'http://127.0.0.1:3100',
                VITE_RENDERER_ORIGIN: 'http://renderer.localhost:3101',
            }),
        );
        await waitForUrl('http://127.0.0.1:5174');
        return teardown;
    } catch (error) {
        await teardown();
        throw error;
    }
}

function start(action: string, args: string[], environment: NodeJS.ProcessEnv = {}): ChildProcess {
    return spawn(action, args, {
        cwd: repositoryRoot,
        detached: true,
        env: { ...process.env, ...environment },
        stdio: 'inherit',
    });
}

function stop(child: ChildProcess): void {
    if (child.pid === undefined || child.exitCode !== null) return;
    try {
        process.kill(-child.pid, 'SIGTERM');
    } catch {
        return;
    }
}

async function startMongo(containerName: string): Promise<string> {
    await exec('docker', [
        'run',
        '--detach',
        '--name',
        containerName,
        '--publish',
        '127.0.0.1::27017',
        'mongo:7',
        'mongod',
        '--replSet',
        'rs0',
        '--bind_ip_all',
    ]);
    await waitForMongo(containerName);
    await exec('docker', [
        'exec',
        containerName,
        'mongosh',
        '--quiet',
        '--eval',
        'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27017"}]})',
    ]);
    await waitForReplicaSet(containerName);
    const { stdout } = await exec('docker', ['port', containerName, '27017/tcp']);
    const port = stdout.trim().match(/:(\d+)$/)?.[1];
    if (!port) throw new Error(`Could not resolve the MongoDB port from: ${stdout}`);
    return port;
}

async function waitForMongo(containerName: string): Promise<void> {
    await retry(async () => {
        await exec('docker', [
            'exec',
            containerName,
            'mongosh',
            '--quiet',
            '--eval',
            'quit(db.adminCommand("ping").ok ? 0 : 1)',
        ]);
    });
}

async function waitForReplicaSet(containerName: string): Promise<void> {
    await retry(async () => {
        await exec('docker', [
            'exec',
            containerName,
            'mongosh',
            '--quiet',
            '--eval',
            'quit(rs.status().myState === 1 ? 0 : 1)',
        ]);
    });
}

async function waitForUrl(url: string): Promise<void> {
    await retry(async () => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    }, 120);
}

async function retry(action: () => Promise<void>, attempts = 60): Promise<void> {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
            await action();
            return;
        } catch (error) {
            lastError = error;
            await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
        }
    }
    throw lastError;
}
