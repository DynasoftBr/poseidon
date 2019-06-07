import { IConcreteEntity } from "@poseidon/core-models";
import { ICommandRequest } from "./src/pipelines/command/command-request";
import { CommandPipelineItem } from "./src/pipelines/command/command-pipeline-item";

export class CommandPipeline<T extends IConcreteEntity = IConcreteEntity> {

    private start: CommandPipelineItem;
    constructor(handlers: CommandPipelineItem[]) {

        if (!handlers || handlers.length == 0) {
            throw new Error("The 'handlers' param must be an not null array with at least one element.");
        }

        handlers = [...handlers, async () => { return; }];
        this.start = handlers.reduce((accumulator, currentValue, idx) => {
            return (request) => accumulator(request, currentValue);
        });
    }

    public async handle(request: ICommandRequest<T>): Promise<void> {
        this.start(request);
    }
}
const handler1 = async (request: any, next: any) => { console.log("teste"); next(request); };
const handler2 = async (request: any, next: any) => { console.log("teste2"); next(request); };
const handler3 = async (request: any, next: any) => { console.log("teste3"); next(request); };

const pipe = new CommandPipeline([handler1, handler2, handler3]);

pipe.handle({} as ICommandRequest);