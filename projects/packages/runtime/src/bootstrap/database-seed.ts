import type { BootstrapModel, Entity } from '@poseidon/models';
import type { DataStorage } from '@poseidon/data-access';

export class DatabaseSeed {
    public constructor(private readonly storage: DataStorage) {}

    public async apply(model: BootstrapModel): Promise<boolean> {
        const namesById = new Map(model.entityTypes.map((type) => [type._id, type.name]));
        const entities = bootstrapEntities(model);
        for (const entityTypeId of new Set(entities.map((entity) => entity._entityTypeId))) {
            await this.resolveEntityTypeName(entityTypeId, namesById);
        }
        let created = false;
        for (const entity of entities) {
            const entityTypeName = await this.resolveEntityTypeName(
                entity._entityTypeId,
                namesById,
            );
            if (await this.storage.get(entityTypeName, entity._id)) continue;
            await this.storage.create(entityTypeName, entity);
            created = true;
        }
        return created;
    }

    private async resolveEntityTypeName(
        entityTypeId: string,
        namesById: Map<string, string>,
    ): Promise<string> {
        const known = namesById.get(entityTypeId);
        if (known) return known;
        const entityType = await this.storage.get('entity-type', entityTypeId);
        if (typeof entityType?.name !== 'string') {
            throw new Error(`Seed entity type '${entityTypeId}' has no definition.`);
        }
        namesById.set(entityTypeId, entityType.name);
        return entityType.name;
    }
}

function bootstrapEntities(model: BootstrapModel): Entity[] {
    return [...model.users, ...model.entityTypes, ...model.indexes, ...model.scripts];
}
