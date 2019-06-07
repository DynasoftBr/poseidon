import { IMessage } from "@poseidon/core-models";

export interface IMessagePublisher {

    publish(message: IMessage): Promise<void>;
}