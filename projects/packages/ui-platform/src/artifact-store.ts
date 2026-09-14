import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface ArtifactStore {
    put(content: string): Promise<string>;
    read(id: string): Promise<string>;
}
export class FileArtifactStore implements ArtifactStore {
    public constructor(private readonly directory: string) {}
    public async put(content: string): Promise<string> {
        const id = createHash('sha256').update(content).digest('hex');
        await mkdir(this.directory, { recursive: true });
        await writeFile(join(this.directory, id), content, { flag: 'wx' }).catch(
            (error: unknown) => {
                if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) {
                    throw error;
                }
            },
        );
        return id;
    }
    public async read(id: string): Promise<string> {
        if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('Invalid managed artifact identifier.');
        return await readFile(join(this.directory, id), 'utf8');
    }
}
