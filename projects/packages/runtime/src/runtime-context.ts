import type { DataStorage } from '@poseidon/data-access';
import type { Entity, EntityData } from '@poseidon/models';
import type { PoseidonContext } from './poseidon-context';
import { RuntimeRepository } from './runtime-repository';
import type { EntityForTypeName } from './system';

export interface UntrustedCodeResult {
    payload?: EntityData;
    output?: unknown;
}

export interface UntrustedCodeRunner {
    execute(
        code: string,
        context: PoseidonContext,
        payload: EntityData,
    ): Promise<UntrustedCodeResult>;
}

export class RuntimeContext implements PoseidonContext {
    public constructor(
        public readonly storage: DataStorage,
        public readonly user: Entity,
        public readonly untrustedCodeRunner?: UntrustedCodeRunner,
    ) {}

    public repository<TName extends string>(
        entityTypeName: TName,
    ): RuntimeRepository<EntityForTypeName<TName>> {
        return new RuntimeRepository<EntityForTypeName<TName>>(entityTypeName, this);
    }
}
