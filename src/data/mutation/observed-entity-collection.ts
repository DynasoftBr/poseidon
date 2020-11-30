import {
  Entity,
  EntityType,
  PropertyTypes,
  RelationLink,
  EntityProperty,
  EntityTypeCommands,
  IUser,
  SysEntities,
} from "@poseidon/core-models";
import { MutationState } from "./mutation-state";
import { ObservedCollectionProxyHandler } from "./observed-collection-proxy-handler";
import { ObservedEntityProxyHandler } from "./observed-entity-proxy-handler";
import { ObservedEntity } from "./observed-entity";
import { Context } from "../context";
import { TargetTypeEnum } from "inversify";

export class ObservedEntityCollection {
  #mutationList = new Map<string, ObservedEntity<Entity>>();

  constructor(private context: Context) {}

  public attach<T extends Entity>(entity: T, entityType: EntityType, state: MutationState = MutationState.unchanged): T {
    let observed = this.#mutationList.get(entity._id);

    // Already tracking this entity.
    if (observed) return observed as T;

    observed = new Proxy(entity, new ObservedEntityProxyHandler(this, entityType, state));
    this.#mutationList.set(entity._id, observed);

    // We need to also track all nested entities.

    const relations = entityType.props.filter((p) => p.type === PropertyTypes.relation);
    for (const relation of relations) {
      const value = entity[relation.name as keyof T] as unknown as Entity;
      if (value == null) continue;

      // The value of the relation can be an array of related entities,
      // we need to iterate this array transforming each related entity into observed.
      if (Array.isArray(value)) {
        const newArr = value.map((i: Entity) => {
          return this.attach(i, relation.relatedEntityType, state);
        });

        // We also use a proxy to track changes in the array itself, like new entity added or deleted, so we can add or reove the relation.
        (<any>entity[relation.name as keyof T]) = new Proxy(newArr, new ObservedCollectionProxyHandler());
      } else {
        (<any>entity[relation.name  as keyof T]) = this.attach(value, relation.relatedEntityType, state);
      }
    }

    return observed as T;
  }

  public has(entity: Entity): boolean {
    return this.#mutationList.get(entity._id) != null;
  }

  public addOrRemoveLink(prop: EntityProperty, thisId: string, thatId: string, state: MutationState) {
    if (this.#mutationList.get(`${prop._id}_${thisId}_${thatId}`)) return;

    this.#mutationList.set(
      `${prop._id}_${thisId}_${thatId}`,
      new Proxy(
        {
          relationPropId: prop._id,
          thisId: thisId,
          thatId: thatId,
        } as RelationLink,
        new ObservedEntityProxyHandler(this, this.context.getEntityTypeByName(SysEntities.relationLink), state)
      )
    );

    if (prop.reverseProp) {
      this.addOrRemoveLink(prop.reverseProp, thatId, thisId, state);
    }
  }

  public toArray(): ObservedEntity<Entity>[] {
    return Array.from(this.#mutationList.values());
  }
}
