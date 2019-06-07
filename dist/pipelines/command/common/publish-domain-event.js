"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_models_1 = require("@poseidon/core-models");
function publishDomainEvent(request, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = {
            type: core_models_1.MessageType.command,
            content: request.entity
        };
        // TODO: Use an custom error.
        try {
            this.messagePublisher.publish(message);
            return next(request);
        }
        catch (error) {
            throw error;
        }
    });
}
exports.publishDomainEvent = publishDomainEvent;
//# sourceMappingURL=publish-domain-event.js.map