import { Entity } from "./";
import { UserRef, BranchRef } from "./helpers";

export interface ConcreteEntity extends Entity {
    _id: string;
    createdAt: Date;
    changeddAt?: Date;
    createdBy: UserRef;
    changedBy?: UserRef;
    branch: BranchRef
}