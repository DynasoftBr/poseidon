"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.ValidationProblem = void 0;
var util = require("util");
var core_models_1 = require("@poseidon/core-models");
var _1 = require(".");
var ValidationProblem = /** @class */ (function () {
    function ValidationProblem(property, keyword, sysMsg) {
        var params = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            params[_i - 3] = arguments[_i];
        }
        this.property = property;
        this.keyword = keyword;
        this.code = sysMsg.code;
        this.message = util.format.apply(util, __spreadArrays([sysMsg.message], params));
    }
    ValidationProblem.buildMsg = function (err) {
        var dtPath = err.dataPath.replace(/\./, "");
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
            case core_models_1.ProblemKeywords["enum"]:
                return new ValidationProblem(dtPath, err.keyword, _1.SysMsgs.validation["enum"], dtPath, err.params.i, err.params.j);
        }
    };
    ValidationProblem.prototype.toJSON = function () {
        return {
            property: this.property,
            keyword: this.keyword,
            code: this.code,
            message: this.message
        };
    };
    return ValidationProblem;
}());
exports.ValidationProblem = ValidationProblem;
