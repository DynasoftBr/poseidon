"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const _1 = require("../../");
class ValidationProblem {
    constructor(property, keyword, sysMsg, ...params) {
        this.property = property;
        this.keyword = keyword;
        this.code = sysMsg.code;
        this.message = util.format(sysMsg.message, ...params);
    }
    static buildMsg(err) {
        let dtPath = err.dataPath.replace(/\./, "");
        if (err.keyword === "minLength")
            return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.minLength, dtPath, err.params.limit);
        else if (err.keyword === "maxLength")
            return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.maxLength, dtPath, err.params.limit);
        else if (err.keyword === "maxItems")
            return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.maxItems, dtPath, err.params.limit);
        else if (err.keyword === "additionalProperties") {
            dtPath = (dtPath === "" ? "" : dtPath + ".") + err.params.additionalProperty;
            return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.additionalProperties, dtPath);
        }
        else if (err.keyword === "format")
            return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.dateFormat);
        else if (err.keyword === "minimum")
            return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.minimum, dtPath, err.params.limit);
        else if (err.keyword === "maximum")
            return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.maximum, dtPath, err.params.limit);
        else if (err.keyword === "multipleOf")
            return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.multipleOf, dtPath, err.params.multipleOf);
        else if (err.keyword === "pattern")
            return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.pattern, dtPath, err.params.pattern);
        else if (err.keyword === "required") {
            dtPath = (dtPath === "" ? "" : dtPath + ".") + err.params.missingProperty;
            return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.required, dtPath);
        }
        else if (err.keyword === "type")
            return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.type, err.params.type);
        else if (err.keyword === "uniqueItems")
            return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.uniqueItems, dtPath, err.params.i, err.params.j);
        else if (err.keyword === "enum")
            return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation.enum, dtPath, err.params.i, err.params.j);
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