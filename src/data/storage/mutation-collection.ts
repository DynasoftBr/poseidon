import { Entity, EntityType, PropertyTypes, RelationLink, EntityProperty } from "@poseidon/core-models";
import { ObservedEntity } from "../mutation/observed-entity";
import { EntityMutationState } from "../mutation/entity-mutation-state";
import { ObservedColectionProxyHandler } from "../mutation/observed-colection-proxy-handler";
import { BuiltInEntries } from "../builtin-entries";
import { v4 as uuidv4 } from "uuid";
export class MutationCollection {
  #mutationList = new Map<string, ObservedEntity>();

  [position: number]: ObservedEntity;

  public add<T extends Entity>(
    entity: T,
    entityType: EntityType,
    state: EntityMutationState = EntityMutationState.unchanged
  ): ObservedEntity {
    let observed = this.#mutationList.get(entity._id);

    // Already tracking this entity.
    if (observed) return;

    observed = new ObservedEntity(entity, entityType, state);
    this.#mutationList.set(entity._id, observed);

    // We need to also track all nested entities.

    const relations = entityType.props.filter((p) => p.type === PropertyTypes.relation);
    for (const relation of relations) {
      const value = entity[relation.name];
      if (value == null) continue;

      // The value of the relation can be an array of related entities, we need to iterate this array transforming each related entity into observed.
      if (Array.isArray(value)) {
        const newArr = value.map((i: Entity) => {
          // Only add this entity to the list if we are not tracking it already.
          let relatedObserved = this.#mutationList.get(i._id);
          if (!relatedObserved) {
            relatedObserved = new ObservedEntity(i, relation.relatedEntityType, state);
            this.#mutationList.set(i._id, relatedObserved);
          }

          // If creating a new entity we need to add the relation entity that ties this relationship.
          if (state === EntityMutationState.added) {
            this.addRelationLink(relation, entity._id, i._id);
          }

          return relatedObserved;
        });

        // We also use a proxy to track changes in the array itself, like new entity added or deleted, so we can add or reove the relation.
        (<any>entity[relation.name]) = new Proxy(newArr, new ObservedColectionProxyHandler());
      } else {
        let relatedObserved = this.#mutationList.get(value._id);

        // Only add this entity to the list if we are not tracking it already.
        if (!relatedObserved) {
          relatedObserved = new ObservedEntity(value, relation.relatedEntityType, state);
          (<any>entity[relation.name]) = relatedObserved;
          this.#mutationList.set(value._id, relatedObserved);
        }

        // If creating a new entity we need to add the relation entity that ties this relationship.
        if (state === EntityMutationState.added) {
          this.addRelationLink(relation, entity._id, value._id);
        }
      }
    }

    return observed;
  }

  public has(entity: Entity): boolean;
  public has(entity: ObservedEntity | Entity): boolean {
    return this.#mutationList.get(entity._id) != null;
  }

  public *toArray() {
    for (const item of this.#mutationList) yield item[1];
  }

  private addRelationLink(relation: EntityProperty, entityId: string, relatedId: string) {
    if (this.#mutationList.get(`${relation._id}_${entityId}_${relatedId}`) == null) {
      this.#mutationList.set(
        `${relation._id}_${entityId}_${relatedId}`,
        new ObservedEntity(
          {
            _id: uuidv4(),
            _createdBy: new BuiltInEntries().rootUser,
            _createdAt: new Date(),
            relationId: relation._id,
            this: entityId,
            that: relatedId,
          } as RelationLink,
          new BuiltInEntries().entityTypeRelation,
          EntityMutationState.added
        )
      );
    }

    if (this.#mutationList.get(`${relation._id}_${relatedId}_${entityId}`)) {
      this.#mutationList.set(
        `${relation._id}_${relatedId}_${entityId}`,
        new ObservedEntity(
          {
            _id: uuidv4(),
            _createdBy: new BuiltInEntries().rootUser,
            _createdAt: new Date(),
            relationId: relation.reverseProp._id,
            this: relatedId,
            that: entityId,
          } as RelationLink,
          new BuiltInEntries().entityTypeRelation,
          EntityMutationState.added
        )
      );
    }
  }
}
