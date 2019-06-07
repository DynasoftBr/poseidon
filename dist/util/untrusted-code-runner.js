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
const vm2_1 = require("vm2");
class UntrustedCodeRunner {
    constructor(code) {
        this.script = new vm2_1.VMScript(code);
    }
    run(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const vm = new vm2_1.VM({
                timeout: 60000,
                sandbox: params
            });
            return vm.run(this.script);
        });
    }
}
exports.UntrustedCodeRunner = UntrustedCodeRunner;
//# sourceMappingURL=untrusted-code-runner.js.map