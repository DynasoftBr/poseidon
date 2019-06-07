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
const specificaiton_1 = require("./specificaiton");
const _ = require("lodash");
class MemberComparisonSpecification extends specificaiton_1.Specification {
    constructor() {
        super("", "");
    }
    eval(fact) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.compareFunc(fact);
        });
    }
    getCompareFunction() {
        switch (this.operator) {
            case "?": return (fact) => _.get(fact, this.member) != null;
            case ">": return (fact) => _.get(fact, this.member) > this.value;
            case "<": return (fact) => _.get(fact, this.member) < this.value;
            case ">=": return (fact) => _.get(fact, this.member) >= this.value;
            case "<=": return (fact) => _.get(fact, this.member) <= this.value;
            case "==": return (fact) => _.get(fact, this.member) == this.value;
            case "!=": return (fact) => _.get(fact, this.member) != this.value;
            case "*%": return (fact) => {
                const memberValue = (_.get(fact, this.member) || "");
                return memberValue.toString().indexOf(this.value) == 0;
            };
            case "%*": return (fact) => {
                const memberValue = (_.get(fact, this.member) || "").toString();
                const expectedIdx = memberValue.length - this.value.length - 1;
                return memberValue.indexOf(this.value) == expectedIdx;
            };
            case "%*": return (fact) => {
                const memberValue = (_.get(fact, this.member) || "").toString();
                const expectedIdx = memberValue.length - this.value.length - 1;
                return memberValue.indexOf(this.value) == expectedIdx;
            };
        }
    }
}
exports.MemberComparisonSpecification = MemberComparisonSpecification;
//# sourceMappingURL=member-comparison-specification.js.map