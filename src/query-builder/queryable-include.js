"use strict";
exports.__esModule = true;
exports.QueryableInclude = void 0;
var queryable_1 = require("./queryable");
var QueryableInclude = /** @class */ (function () {
    function QueryableInclude(includeQuery) {
        this.includeQuery = includeQuery;
        this._underlyingQueryable = new queryable_1.Queryable(function () { return null; }, includeQuery);
    }
    QueryableInclude.prototype.recursive = function () {
        this.includeQuery.$recursive = true;
        return new QueryableInclude(this.includeQuery);
    };
    QueryableInclude.prototype.include = function (k, b) {
        this._underlyingQueryable.include(k, b);
        return new QueryableInclude(this.includeQuery);
    };
    QueryableInclude.prototype.where = function (func) {
        this._underlyingQueryable.where(func);
        return this;
    };
    QueryableInclude.prototype.having = function (func) {
        this._underlyingQueryable.having(func);
        return this;
    };
    QueryableInclude.prototype.aggregate = function (func) {
        this._underlyingQueryable.aggregate(func);
        return new QueryableInclude(this.includeQuery);
    };
    QueryableInclude.prototype.select = function () {
        var keys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            keys[_i] = arguments[_i];
        }
        throw new Error("Method not implemented.");
    };
    return QueryableInclude;
}());
exports.QueryableInclude = QueryableInclude;
