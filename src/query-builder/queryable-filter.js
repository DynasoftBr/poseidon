"use strict";
exports.__esModule = true;
exports.QueryableFilter = void 0;
var QueryableFilter = /** @class */ (function () {
    function QueryableFilter(group) {
        this.group = group;
    }
    QueryableFilter.prototype.filter = function (key, operator, operand, field) {
        var _a;
        var condition = {};
        var computedOperand = "";
        if (typeof operand === "function") {
            computedOperand = "_ROOT_";
            var proxyHandler = {
                get: function (target, prop) {
                    var splitted = computedOperand.split(".");
                    computedOperand = [splitted[0], splitted[1]].filter(function (c) { return !!c; }).join("_") + ("." + prop);
                    return proxy_1;
                }
            };
            var proxy_1 = new Proxy({}, proxyHandler);
            operand(proxy_1);
            computedOperand = "$[" + computedOperand + "]";
        }
        else if (field === true) {
            computedOperand = "$[" + operand + "]";
        }
        else {
            computedOperand = operand;
        }
        condition[key] = (_a = {}, _a[operator] = computedOperand, _a);
        this.group.push(condition);
        return this;
    };
    QueryableFilter.prototype.$or = function (func) {
        var orGroup = [];
        var builder = new QueryableFilter(orGroup);
        func && func(builder);
        this.group.push(orGroup);
        return this;
    };
    return QueryableFilter;
}());
exports.QueryableFilter = QueryableFilter;
