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
function unhandledException() {
    return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield next();
        }
        catch (error) {
            // if (error.code === SysMsgs.error.noEntityTypeSpecified.code
            //     || error.code === SysMsgs.error.abstractEntityType.code
            //     || error.code === SysMsgs.error.invalidHeaderParameters.code) {
            //     ctx.status = HttpStatus.BAD_REQUEST;
            //     ctx.body = error;
            // }
            // else if (error.code === SysMsgs.error.entityNotFound.code
            //     || error.code === SysMsgs.error.entityTypeNotFound.code)
            //     res.status(404).send(error);
            // else if (error.code === SysMsgs.validation.validationErrorMsg.code)
            //     res.status(422).send(error);
            // else if (error.code === SysMsgs.error.methodNotAllowed.code)
            //     res.status(405).send(error);
            // else {
            //     res.status(500).send();
            //     winston.error(error.message, error);
            // }
        }
    });
}
exports.unhandledException = unhandledException;
//# sourceMappingURL=exception-middleware.js.map