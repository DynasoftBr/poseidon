import { Entity } from "./";
import { UserRef } from "./helpers";

export interface ConcreteEntity extends Entity {
    _id: string;
    createdAt: Date;
    changeddAt?: Date;
    createdBy: UserRef;
    changedBy?: UserRef;
}