import { Entity, EntityType, PropertyTypes, EntityProperty, RelationKind, RelationLink } from "@poseidon/core-models";
import { MutationState } from "./mutation-state";
import { ObservedEntity } from "./observed-entity";
import { ObservedEntityCollection } from "./observed-entity-collection";

export class ObservedEntityProxyHandler<T extends Entity> implements ProxyHandler<T> {
  __observed = true;

  __original: Partial<T> = {};

  constructor(private collection: ObservedEntityCollection, private __entityType: EntityType, private __mutationState: MutationState) {}

  public getPrototypeOf?(target: Entity): object | null {
    return Reflect.getPrototypeOf(target);
  }

  public setPrototypeOf?(target: Entity, v: any): boolean {
    return false;
  }

  public isExtensible?(target: Entity): boolean {
    return true;
  }

  public preventExtensions?(target: Entity): boolean {
    return false;
  }

  public getOwnPropertyDescriptor?(target: Entity, p: PropertyKey): PropertyDescriptor | undefined {
    return Reflect.getOwnPropertyDescriptor(target, p);
  }

  public has?(target: Entity, p: PropertyKey): boolean {
    return Reflect.has(target, p);
  }

  public get?(target: Entity, p: PropertyKey, receiver: any): any {
    if (p === "__observed") return this.__observed;
    else if (p === "__entityType") return this.__entityType;
    else if (p === "__mutationState") return this.__mutationState;

    return Reflect.get(target, p, receiver);
  }

  public set?(target: T, p: keyof T, value: any, receiver: any): boolean {
    const entityType = this.__entityType;

    const prop = entityType.props.find((pr) => pr.name === p);

    if (prop == null) throw new Error("invalid");

    const isRelation = prop.type === PropertyTypes.relation;
    if (!isRelation && target[p] !== value) {
      this.__original[p] = target[p];

      target[p] = value;
      if (this.__mutationState === MutationState.unchanged) {
        this.__mutationState = MutationState.changed;
      }
    } else if (isRelation) {
      this.setRelated(target, prop, value);
    }

    return true;
  }

  public deleteProperty?(target: Entity, p: PropertyKey): boolean {
    throw "Properties can not be deleted";
  }

  public defineProperty?(target: Entity, p: PropertyKey, attributes: PropertyDescriptor): boolean {
    return (target as any).defineProperty(target, p, attributes);
  }

  private setRelated(target: Entity, prop: EntityProperty, value: ObservedEntity<Entity>) {
    const currValue = target[prop.name as keyof Entity] as Entity;

    if ([RelationKind.belongsToMany, RelationKind.hasMany].indexOf(prop.relationKind) > -1) {
      throw new Error("It's not possible to directly change.");
    } else if (currValue === undefined) {
      throw new Error("To change a relationship you need to first load it.");
    } else if (value.__observed !== true) {
      throw new Error("Invalid");
    } else if (value.__entityType.name !== prop.relatedEntityType.name) {
      throw new Error("Invalid");
    }

    if (value._id != currValue?._id) {
      target[prop.name as keyof Entity] = value;

      this.collection.addOrRemoveLink(prop, target._id, value._id, MutationState.added);

      if (currValue !== null) {
        this.collection.addOrRemoveLink(prop, target._id, currValue._id, MutationState.deleted);
      }
    }
  }
}
