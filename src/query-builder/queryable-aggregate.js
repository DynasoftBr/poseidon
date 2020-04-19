"use strict";
exports.__esModule = true;
exports.QueryableAggregate = void 0;
var QueryableAggregate = /** @class */ (function () {
    function QueryableAggregate(_aggregate) {
        this._aggregate = _aggregate;
    }
    QueryableAggregate.prototype.$sum = function (key, as) {
        this._aggregate[as || key] = "$sum";
        return new QueryableAggregate(this._aggregate);
    };
    QueryableAggregate.prototype.$count = function (key, as) {
        this._aggregate[as || key] = "$count";
        return new QueryableAggregate(this._aggregate);
    };
    QueryableAggregate.prototype.$avg = function (key, as) {
        this._aggregate[as || key] = "$avg";
        return new QueryableAggregate(this._aggregate);
    };
    QueryableAggregate.prototype.$group = function () {
        var keys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            keys[_i] = arguments[_i];
        }
        for (var _a = 0, keys_1 = keys; _a < keys_1.length; _a++) {
            var key = keys_1[_a];
            this._aggregate[key] = "$group";
        }
        return new QueryableAggregate(this._aggregate);
    };
    return QueryableAggregate;
}());
exports.QueryableAggregate = QueryableAggregate;
