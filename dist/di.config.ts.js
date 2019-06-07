"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const message_publisher_1 = require("./messaging/message-publisher");
exports.DI = {
    Container: Symbol.for("Container"),
    MessagePublisher: Symbol.for("MessagePublisher")
};
function configureDI() {
    const container = new inversify_1.Container();
    container.bind(exports.DI.Container).toConstantValue(container);
    container.bind(exports.DI.MessagePublisher).to(message_publisher_1.MessagePublisher).inSingletonScope();
    return container;
}
exports.configureDI = configureDI;
//# sourceMappingURL=di.config.ts.js.map