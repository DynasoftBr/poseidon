import type { Entity } from '../entity';

export interface AppData extends Record<string, unknown> {
    name: string;
    domain: string;
    basePath: string;
    entryComponentId: string;
    publishedReleaseId?: string;
}

export type App = Entity<AppData>;
