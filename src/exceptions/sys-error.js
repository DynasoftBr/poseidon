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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.SysError = void 0;
var util = require("util");
var _1 = require(".");
/**
 * A custom Error class
 * @class
 */
var SysError = /** @class */ (function (_super) {
    __extends(SysError, _super);
    /**
     * Contruscts the SysError class.
     * @param type The type of the error.
     * @param sysMsg The SysMsg object.
     * @param params Params to be formated into the message string.
     */
    function SysError(type, sysMsg) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        var _this = _super.call(this, util.format.apply(util, __spreadArrays([sysMsg.message], params))) || this;
        _this.type = type;
        // properly capture stack trace in Node.js
        Error.captureStackTrace(_this, _this.constructor);
        _this.name = _this.constructor.name;
        _this.code = sysMsg.code;
        _this.type = type;
        return _this;
    }
    SysError.prototype.toJSON = function () {
        return { type: this.type, code: this.code, message: this.message };
    };
    /**
     * Returns a new SysError class for 'Unexpected Error' error.
     * @func
     * @static
     * @param aditionalMsg: A complement for the default message.
     */
    SysError.unexpectedError = function (aditionalMsg) {
        return new SysError("unexpected", _1.SysMsgs.error.unexpectedError, aditionalMsg);
    };
    return SysError;
}(Error));
exports.SysError = SysError;
