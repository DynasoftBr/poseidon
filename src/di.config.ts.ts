
import { Container } from "inversify";
import { IMessagePublisher } from "./messaging";
import { MessagePublisher } from "./messaging/message-publisher";

export const DI = {
    Container: Symbol.for("Container"),
    MessagePublisher: Symbol.for("MessagePublisher")
};

export function configureDI(): Container {
    const container = new Container();

    container.bind<Container>(DI.Container).toConstantValue(container);
    container.bind<IMessagePublisher>(DI.MessagePublisher).to(MessagePublisher).inSingletonScope();

    return container;
}
