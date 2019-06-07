import { IConcreteEntity, IEntityType } from "@poseidon/core-models";
import { ICommandRequest } from "./command-request";
import { CommandPipelineItem } from "./command-pipeline-item";

export class CommandPipeline<T extends IConcreteEntity = IConcreteEntity> {

    constructor(private readonly handlers: CommandPipelineItem[]) {

        if (!handlers || handlers.length == 0) {
            throw new Error("The 'handlers' param must be an not null array with at least one element.");
        }

        this.handlers = [...handlers, async () => { return; }].map((h, i) => req => h(req, handlers[i + 1]));
    }

    public async handle(request: ICommandRequest<T>): Promise<void> {
        this.handlers[0](request);
    }
}