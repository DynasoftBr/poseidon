import { IConcreteEntity, IMessage } from "@poseidon/core-models";
import { ICommandRequest } from "../command-request";
import { MessageType } from "@poseidon/core-models";
import { NextPipelineItem } from "../command-pipeline-item";

export async function publishDomainEvent(request: ICommandRequest<IConcreteEntity>, next: NextPipelineItem): Promise<void> {
    // const message: IMessage = {
    //     type: MessageType.command,
    //     content: request.entity
    // } as IMessage;

    // // TODO: Use an custom error.
    // try {
    //     this.messagePublisher.publish(message);
    //     return next(request);
    // } catch (error) {
    //     throw error;
    // }
}