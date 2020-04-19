"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.ValidationError = void 0;
var _1 = require(".");
/**
 * A custom Error class
 * @class
 */
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(validationProblems) {
        var _this = _super.call(this, "validation", _1.SysMsgs.validation.validationErrorMsg) || this;
        _this.validationProblems = validationProblems;
        _this.errorCount = validationProblems.length;
        return _this;
    }
    ValidationError.prototype.toJSON = function () {
        var _a = this, type = _a.type, code = _a.code, message = _a.message, errorCount = _a.errorCount, validationProblems = _a.validationProblems;
        return {
            type: type,
            code: code,
            message: message,
            errorCount: errorCount,
            validationProblems: validationProblems
        };
    };
    return ValidationError;
}(_1.SysError));
exports.ValidationError = ValidationError;
