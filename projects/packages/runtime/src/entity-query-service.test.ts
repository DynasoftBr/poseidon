import type { EntityProjection, QueryEntitiesCommand } from '@poseidon/model';
import { EntityQueryService, type EntityQueryStore } from './entity-query-service';

describe('EntityQueryService', () => {
    it('should delegate a declarative query after resolving its EntityType', async () => {
        const store = new QueryStore();
        const command: QueryEntitiesCommand = {
            entityTypeId: 'person',
            filter: { operator: 'equals', property: 'name', value: 'Ada' },
            limit: 10,
        };

        const result = await new EntityQueryService(store).list(command);

        expect(result).toEqual([projection('ada', 'person', { name: 'Ada' })]);
        expect(store.command).toEqual(command);
    });

    it('should reject an invalid page size', async () => {
        await expect(
            new EntityQueryService(new QueryStore()).list({ entityTypeId: 'person', limit: 0 }),
        ).rejects.toMatchObject({ code: 'validation' });
    });

    it('should reject an unknown EntityType and invalid offset', async () => {
        const service = new EntityQueryService(new QueryStore());

        await expect(service.list({ entityTypeId: 'missing' })).rejects.toMatchObject({
            code: 'entity-type-not-found',
        });
        await expect(service.list({ entityTypeId: 'person', offset: -1 })).rejects.toMatchObject({
            code: 'validation',
        });
        await expect(service.list({ entityTypeId: 'person', limit: 1.5 })).rejects.toMatchObject({
            code: 'validation',
        });
    });
});

class QueryStore implements EntityQueryStore {
    public command: QueryEntitiesCommand | undefined;

    public findProjection(id: string): Promise<EntityProjection | null> {
        return Promise.resolve(id === 'person' ? projection('person', 'entity-type', {}) : null);
    }

    public findByEntityType(command: QueryEntitiesCommand): Promise<EntityProjection[]> {
        this.command = command;
        return Promise.resolve([projection('ada', 'person', { name: 'Ada' })]);
    }
}

function projection(
    id: string,
    entityTypeId: string,
    data: Record<string, unknown>,
): EntityProjection {
    return {
        id,
        entityTypeId,
        data,
        version: 1,
        createdAt: new Date('2026-09-13T00:00:00.000Z'),
        createdById: 'system',
    };
}
