import { IEntityType, IConcreteEntity } from "@poseidon/core-models";
import { ValidationProblem } from "../../exceptions";

export interface ICommandRequest<T extends IConcreteEntity = IConcreteEntity> {
    entity: Partial<T>;
    entityType: IEntityType;
    context: any;
    eventName: string;
    operation: "insert" | "update" | "delete";
    problems?: ValidationProblem[];
}