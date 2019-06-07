"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const core_models_1 = require("@poseidon/core-models");
const _1 = require(".");
class ValidationProblem {
    constructor(property, keyword, sysMsg, ...params) {
        this.property = property;
        this.keyword = keyword;
        this.code = sysMsg.code;
        this.message = util.format(sysMsg.message, ...params);
    }
    static buildMsg(err) {
        let dtPath = err.dataPath.replace(/\./, "");
        switch (err.keyword) {
            case core_models_1.ProblemKeywords.minLength:
                return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.minLength, dtPath, err.params.limit);
            case core_models_1.ProblemKeywords.maxLength:
                return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.maxLength, dtPath, err.params.limit);
            case core_models_1.ProblemKeywords.maxItems:
                return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.maxItems, dtPath, err.params.limit);
            case core_models_1.ProblemKeywords.minItems:
                return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.minItems, dtPath, err.params.limit);
            case core_models_1.ProblemKeywords.additionalProperties:
                dtPath = (dtPath === "" ? "" : dtPath + ".") + err.params.additionalProperty;
                return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.additionalProperties, dtPath);
            case core_models_1.ProblemKeywords.format:
                return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.dateFormat);
            case core_models_1.ProblemKeywords.minimum:
                return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.minimum, dtPath, err.params.limit);
            case core_models_1.ProblemKeywords.maximum:
                return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.maximum, dtPath, err.params.limit);
            case core_models_1.ProblemKeywords.multipleOf:
                return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.multipleOf, dtPath, err.params.multipleOf);
            case core_models_1.ProblemKeywords.pattern:
                return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.pattern, dtPath, err.params.pattern);
            case core_models_1.ProblemKeywords.required:
                dtPath = (dtPath === "" ? "" : dtPath + ".") + err.params.missingProperty;
                return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.required, dtPath);
            case core_models_1.ProblemKeywords.type:
                return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.type, err.params.type);
            case core_models_1.ProblemKeywords.uniqueItems:
                return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.uniqueItems, dtPath, err.params.i, err.params.j);
            case core_models_1.ProblemKeywords.enum:
                return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.enum, dtPath, err.params.i, err.params.j);
        }
    }
    toJSON() {
        return {
            property: this.property,
            keyword: this.keyword,
            code: this.code,
            message: this.message
        };
    }
}
exports.ValidationProblem = ValidationProblem;
//# sourceMappingURL=validation-problem.js.map