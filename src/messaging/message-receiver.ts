import { IMessage } from "@poseidon/core-models/";
import messagePublisher from "./message-publisher";

class Receiver {
  public async subscribe<T = any>(subject: string, callback: (content: IMessage<T>) => void) {
    messagePublisher.on(subject, callback);
  }

  private onAck(message: IMessage) {}

  private onNack(message: IMessage) {}
}

export default new Receiver();
