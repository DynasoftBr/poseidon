import { Entity, EntityType, PropertyTypes, IUser } from "@poseidon/core-models";
import { MutationCollection } from "../storage/mutation-collection";
import { EntityMutationState } from "./entity-mutation-state";
import { ObservedColectionProxyHandler } from "./observed-colection-proxy-handler";
import { proxyHandler } from "./entity-proxy";
export class ObservedEntity implements Entity {
  [key: string]: any;
  _id?: string;
  _state?: "alive" | "deleted";
  _createdAt: Date;
  _changedAt?: Date;
  _createdBy?: IUser;
  _changedBy?: IUser;

  public readonly __observed = true;

  public constructor(public __entity: Entity, public readonly entityType: EntityType, public __state: EntityMutationState) {
    Object.assign(this, __entity);
    return new Proxy<any>(this, proxyHandler);
  }

  public getEntityType() {
    return this.entityType;
  }
}
