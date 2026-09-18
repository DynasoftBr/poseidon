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

    public async entityType(name: string): Promise<Entity | null> {
        const byId = await this.storage.get('entity-type', name);
        if (byId) return byId;
        const matches = await this.storage.query('entity-type', {
            entityTypeId: 'entity-type',
            filter: {
                kind: 'comparison',
                propertyId: 'entity-type:name',
                operator: 'equals',
                value: name,
            },
            limit: 1,
        });
        return matches[0] ?? null;
    }

    public repository<TName extends string>(
        entityTypeName: TName,
    ): RuntimeRepository<EntityForTypeName<TName>> {
        return new RuntimeRepository<EntityForTypeName<TName>>(entityTypeName, this);
    }
}
