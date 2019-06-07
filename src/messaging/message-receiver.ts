import { EventEmitter } from "events";
import { IMessage } from "@poseidon/core-models/";

class Receiver extends EventEmitter {

    async receive() {

        const message = { name: "teste" } as any;
        await this.publish(message);

    }

    async publish(message: IMessage): Promise<void> {

    }

    private onAck(message: IMessage) {

    }

    private onNack(message: IMessage) {

    }
}

export default new Receiver();