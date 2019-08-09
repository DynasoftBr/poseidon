import { IEntityType, IConcreteEntity } from "@poseidon/core-models";
import { ValidationProblem } from "../../exceptions";
import { IDataContext } from "../../data/idata-context";

export interface ICommandRequest<T extends IConcreteEntity = IConcreteEntity> {
    entity: Partial<T>;
    entityType: IEntityType;
    context: IDataContext;
    eventName: string;
    operation: "insert" | "update" | "delete";
    problems?: ValidationProblem[];
}