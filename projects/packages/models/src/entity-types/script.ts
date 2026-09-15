import type { Entity } from '../entity';

export interface ScriptData extends Record<string, unknown> {
    code: string | null;
}

export interface Script extends Entity, ScriptData {}
