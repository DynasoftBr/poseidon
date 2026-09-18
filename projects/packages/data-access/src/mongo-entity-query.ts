import type { Entity, EntityProperty, QueryEntitiesAction } from '@poseidon/models';
import type { ClientSession, MongoClient } from 'mongodb';
import { toMongoSpecification } from './mongo-specification';

export async function findEntities(
    client: MongoClient,
    entityTypeName: string,
    action: QueryEntitiesAction,
    session?: ClientSession,
): Promise<Entity[]> {
    const options = session ? { session } : undefined;
    const type = await client
        .db()
        .collection<Entity>('entity-type')
        .findOne({ name: entityTypeName }, options);
    const properties = (type?.properties ?? []) as EntityProperty[];
    const filter = action.filter
        ? {
              $expr: toMongoSpecification(
                  action.filter,
                  new Map(properties.map((property) => [property._id, property.name])),
              ),
          }
        : {};
    return await client
        .db()
        .collection<Entity>(entityTypeName)
        .find(
            {
                _entityTypeId: type?._id ?? entityTypeName,
                _deletedAt: { $exists: false },
                ...filter,
            },
            options,
        )
        .skip(action.offset ?? 0)
        .limit(action.limit ?? 100)
        .toArray();
}
