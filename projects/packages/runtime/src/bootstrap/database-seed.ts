import type { BootstrapModel, Entity } from '@poseidon/models';
import type { DataStorage } from '@poseidon/data-access';

export class DatabaseSeed {
    public constructor(private readonly storage: DataStorage) {}

    public async apply(model: BootstrapModel): Promise<boolean> {
        let created = false;
        for (const entity of bootstrapEntities(model)) {
            if (await this.storage.getById(entity._id)) continue;
            await this.storage.create(entity);
            created = true;
        }
        return created;
    }
}

function bootstrapEntities(model: BootstrapModel): Entity[] {
    return [...model.users, ...model.entityTypes, ...model.entityProperties, ...model.indexes];
}
