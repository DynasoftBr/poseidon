import type { Entity, QueryEntitiesAction } from '@poseidon/models';
import type { ClientSession, MongoClient } from 'mongodb';

export async function findEntities(
    client: MongoClient,
    entityTypeName: string,
    action: QueryEntitiesAction,
    session?: ClientSession,
): Promise<Entity[]> {
    return await client
        .db()
        .collection<Entity>(entityTypeName)
        .find(
            {
                _entityTypeId: action.entityTypeId,
                _deletedAt: { $exists: false },
            },
            session ? { session } : undefined,
        )
        .skip(action.offset ?? 0)
        .limit(action.limit ?? 100)
        .toArray();
}
