import { Entity } from ".";
import { UserRef } from "./references";

export interface ConcreteEntity extends Entity {
    _id: string;
    createdAt: Date;
    changeddAt?: Date;
    createdBy: UserRef;
    changedBy?: UserRef;
}