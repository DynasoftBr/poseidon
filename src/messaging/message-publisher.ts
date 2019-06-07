import { IMessage } from "@poseidon/core-models";
import { IMessagePublisher } from "./interfaces";

export class MessagePublisher implements IMessagePublisher {

    async publish(message: IMessage) {

    }
}


export default new MessagePublisher();