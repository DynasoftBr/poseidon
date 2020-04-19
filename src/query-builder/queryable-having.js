"use strict";
exports.__esModule = true;
exports.QueryableHaving = void 0;
var QueryableHaving = /** @class */ (function () {
    function QueryableHaving(group) {
        this.group = group;
    }
    QueryableHaving.prototype.$or = function (func) {
        var orGroup = [];
        var builder = new QueryableHaving(orGroup);
        func && func(builder);
        this.group.push(orGroup);
        return this;
    };
    QueryableHaving.prototype.$sum = function (key, operator, operand, field) {
        return this.addHavingCondition("$sum", key, operator, operand);
    };
    QueryableHaving.prototype.$count = function (key, operator, operand, field) {
        return this.addHavingCondition("$sum", key, operator, operand);
    };
    QueryableHaving.prototype.$avg = function (key, operator, operand, field) {
        return this.addHavingCondition("$sum", key, operator, operand);
    };
    QueryableHaving.prototype.addHavingCondition = function (func, key, operator, operand, field) {
        var _a, _b, _c;
        var operandResult = typeof operand !== "function"
            ? (!field ? operand : "$[" + operand + "]")
            : operand({});
        var condiion = (_a = {}, _a[func] = (_b = {}, _b[key] = (_c = {}, _c[operator] = operandResult, _c), _b), _a);
        this.group.push(condiion);
        return this;
    };
    return QueryableHaving;
}());
exports.QueryableHaving = QueryableHaving;
