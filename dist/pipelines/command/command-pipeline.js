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
class CommandPipeline {
    constructor(handlers) {
        this.handlers = handlers;
        if (!handlers || handlers.length == 0) {
            throw new Error("The 'handlers' param must be an not null array with at least one element.");
        }
        this.handlers = [...handlers, () => __awaiter(this, void 0, void 0, function* () { return; })].map((h, i) => req => h(req, handlers[i + 1]));
    }
    handle(request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.handlers[0](request);
        });
    }
}
exports.CommandPipeline = CommandPipeline;
//# sourceMappingURL=command-pipeline.js.map