import { Entity, EntityType, PropertyTypes, RelationLink, EntityProperty } from "@poseidon/core-models";
import { ObservedEntity } from "../mutation/observed-entity";
import { EntityMutationState } from "../mutation/entity-mutation-state";
import { ObservedColectionProxyHandler } from "../mutation/observed-colection-proxy-handler";
import { BuiltInEntries } from "../builtin-entries";

export class MutationCollection {
  #mutationList: ObservedEntity[] = [];

  [position: number]: ObservedEntity;

  public add<T extends Entity>(
    entity: T,
    entityType: EntityType,
    state: EntityMutationState = EntityMutationState.unchanged
  ): ObservedEntity {
    const relations = entityType.props.filter((p) => p.type === PropertyTypes.relation);
    const observed = new ObservedEntity(entity, entityType, state);
    this.#mutationList.push(observed);

    for (const relation of relations) {
      const value = entity[relation.name];
      if (value == null) return;

      if (Array.isArray(value)) {
        if (!value.every((c: Entity) => c.entityType != null)) continue;

        const newArr = value.map((i: Entity) => {
          const relatedObserved = new ObservedEntity(i, relation.relatedEntityType, state);
          this.#mutationList.push(relatedObserved);

          // If creating a new entity we need to add the relation entity that ties this relationship.
          if (state === EntityMutationState.added) {
            this.addRelationLink(relation, entity._id, i._id);
          }
        });

        (<any>entity[relation.name]) = new Proxy(newArr, new ObservedColectionProxyHandler());
      } else {
        if ((<Entity>value).entityType == null) continue;

        const relatedObserved = new ObservedEntity(entity, relation.relatedEntityType, state);
        (<any>entity[relation.name]) = relatedObserved;

        this.#mutationList.push(relatedObserved);
      }
    }

    return observed;
  }

  public has(entity: Entity): boolean;
  public has(entity: ObservedEntity | Entity): boolean {
    if ((<ObservedEntity>entity).__observed === true) return this.#mutationList.some((e) => e.__entity._id === entity.__entity._id);
    else return this.#mutationList.some((e) => e.__entity._id === (<Entity>entity)._id);
  }

  public toArray() {
    return this.#mutationList.map((e) => e);
  }

  private addRelationLink(relation: EntityProperty, entityId: string, relatedId: string) {
    this.#mutationList.push(
      new ObservedEntity(
        { relationId: relation._id, this: entityId, that: relatedId } as RelationLink,
        new BuiltInEntries().entityTypeRelation,
        EntityMutationState.added
      )
    );

    this.#mutationList.push(
      new ObservedEntity(
        { relationId: relation.reverseProp._id, this: relatedId, that: entityId } as RelationLink,
        new BuiltInEntries().entityTypeRelation,
        EntityMutationState.added
      )
    );
  }
}
