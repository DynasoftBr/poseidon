import { IMessage } from "@poseidon/core-models";
import { IMessagePublisher } from "./interfaces";
import { EventEmitter } from "events";

class MessagePublisher extends EventEmitter implements IMessagePublisher {
  async publish(message: IMessage) {
    this.emit(message.subject, message);
  }
}

export default new MessagePublisher();
