import { ICommandRequest } from "./command-request";
import { IConcreteEntity } from "@poseidon/core-models";

export type NextPipelineItem<T extends IConcreteEntity = IConcreteEntity>
    = (request: ICommandRequest<T>) => Promise<void>;

export type CommandPipelineItem<T extends IConcreteEntity = IConcreteEntity>
    = (request: ICommandRequest<T>, next?: NextPipelineItem<T>) => Promise<void>;