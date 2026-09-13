import {
    createBootstrapEvents,
    createBootstrapModel,
    ensureBootstrapModel,
    type BootstrapStore,
} from './bootstrap-model';
import { EventPublisher } from './event-publisher';

describe('createBootstrapModel', () => {
    it('should create the core entity types from the shared model', () => {
        const now = new Date('2026-09-13T00:00:00.000Z');

        const model = createBootstrapModel('system', now);

        expect(model.users).toMatchObject([{ id: 'system', login: 'system' }]);
        expect(model.entityTypes).toMatchObject([
            { id: 'entity-type', createdById: 'system', createdAt: now },
            { id: 'entity-property', createdById: 'system', createdAt: now },
            { id: 'index', createdById: 'system', createdAt: now },
            { id: 'user', createdById: 'system', createdAt: now },
            { id: 'relation-link', createdById: 'system', createdAt: now },
        ]);
        expect(model.entityProperties).toHaveLength(33);
        expect(model.entityProperties).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 'entity-type:properties',
                    itemsType: 'reference',
                    relatedEntityTypeId: 'entity-property',
                    uniqueBy: 'name',
                }),
                expect.objectContaining({ id: 'entity-property:default', type: 'json' }),
            ]),
        );
        expect(model.indexes).toHaveLength(2);
    });

    it('should initialize only an empty store', async () => {
        const model = createBootstrapModel('system', new Date());
        const store = createStore([]);
        const publisher = new EventPublisher();

        await expect(ensureBootstrapModel(store, publisher, model)).resolves.toBe(true);
        expect(store.commit).toHaveBeenCalledWith(createBootstrapEvents(model));
    });

    it('should preserve an initialized store', async () => {
        const model = createBootstrapModel('system', new Date());
        const store = createStore(createBootstrapEvents(model).map((event) => event.entityId));
        const publisher = new EventPublisher();

        await expect(ensureBootstrapModel(store, publisher, model)).resolves.toBe(false);
        expect(store.commit).not.toHaveBeenCalled();
    });
});

function createStore(existingIds: string[]): BootstrapStore & { commit: ReturnType<typeof vi.fn> } {
    return {
        hasEntity: vi
            .fn()
            .mockImplementation((id: string) => Promise.resolve(existingIds.includes(id))),
        commit: vi.fn().mockResolvedValue(undefined),
    };
}
