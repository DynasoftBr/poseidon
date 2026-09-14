import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { ReleaseSnapshot } from '@poseidon/models';
import type { UICompiler } from './release-service';

const execute = promisify(execFile);

export class UIBuildError extends Error {}

export class ContainerCompiler implements UICompiler {
    public async compile(
        snapshot: ReleaseSnapshot,
    ): Promise<{ html: string; componentIds: string[] }> {
        const directory = await mkdtemp(join(tmpdir(), 'poseidon-ui-'));
        const container = `poseidon-ui-${randomUUID()}`;
        try {
            await writeFile(join(directory, 'snapshot.json'), JSON.stringify(snapshot));
            await execute(
                'docker',
                [
                    'run',
                    '--rm',
                    '--name',
                    container,
                    '--network=none',
                    '--read-only',
                    '--cap-drop=ALL',
                    '--security-opt=no-new-privileges',
                    '--memory=512m',
                    '--cpus=1',
                    '--pids-limit=64',
                    '--tmpfs=/tmp:rw,noexec,nosuid,size=64m',
                    '--mount',
                    `type=bind,source=${directory},target=/build`,
                    'poseidon-ui-builder:local',
                ],
                { timeout: 60_000, maxBuffer: 2_000_000 },
            );
            const [html, manifest] = await Promise.all([
                readFile(join(directory, 'artifact.html'), 'utf8'),
                readFile(join(directory, 'manifest.json'), 'utf8'),
            ]);
            return { html, componentIds: JSON.parse(manifest) as string[] };
        } catch (error) {
            const diagnostic = await readFile(join(directory, 'error.json'), 'utf8').catch(
                () => '',
            );
            if (diagnostic) {
                const parsed = JSON.parse(diagnostic) as { message: string };
                throw new UIBuildError(parsed.message);
            }
            throw error;
        } finally {
            await execute('docker', ['rm', '-f', container], { timeout: 10_000 }).catch(
                () => undefined,
            );
            await rm(directory, { recursive: true, force: true });
        }
    }
}
