import type { Entity } from '../entity';
import type { Source } from '../source';

export interface ThemeData extends Record<string, unknown> {
    name: string;
    source: Source;
}

export type Theme = Entity<ThemeData>;
