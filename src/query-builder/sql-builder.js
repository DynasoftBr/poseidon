"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var queryable_1 = require("./queryable");
var core_models_1 = require("@poseidon/core-models");
var util = require("util");
var builtin_entries_1 = require("../data/builtin-entries");
var database_error_1 = require("../exceptions/database-error");
var sys_msgs_1 = require("../exceptions/sys-msgs");
var pg_1 = require("pg");
var pool = new pg_1.Pool({
    user: "postgres",
    host: "localhost",
    database: "poseidon",
    password: "admin",
    port: 5432
});
var builtin = builtin_entries_1.BuiltInEntries.build();
var entityType = builtin.entityType;
var repo = [builtin.entityType, builtin.entityTypeEntityProperty, builtin.entityTypeUser, builtin.entityTypeEntityProperty];
var tableCount = 0;
function buildQuery(entityType, query) {
    return __awaiter(this, void 0, void 0, function () {
        var alias, included, select, where, wrapped;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    alias = "_ROOT_";
                    return [4 /*yield*/, buildInclude(query.$include, entityType, alias)];
                case 1:
                    included = _a.sent();
                    select = buildSelect(query.$select, entityType, included, alias);
                    where = buildWhere(query.$where, entityType.name);
                    wrapped = "SELECT row_to_json(" + alias + ") \nFROM (" + (select + where) + ") as " + alias;
                    return [2 /*return*/, wrapped];
            }
        });
    });
}
function buildInclude(includedKeys, entityType, parentAlias) {
    return __awaiter(this, void 0, void 0, function () {
        var joined, _loop_1, _a, _b, _i, key;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    joined = [];
                    _loop_1 = function (key) {
                        var prop, alias, includedEt, includedQuery, included, select, relationTableAlias, join, thisCol, parentCol, condition, where, includedSql;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    prop = entityType.props.find(function (p) { return p.name === key; });
                                    if (prop == null)
                                        throw new database_error_1.DatabaseError(sys_msgs_1.SysMsgs.error.queryParseError, "Invalid property '" + key + "'");
                                    alias = parentAlias + "_" + key;
                                    includedEt = prop.relatedEntityType;
                                    includedQuery = (includedKeys[key] === true ? {} : includedKeys[key]);
                                    includedQuery.$where = includedQuery.$where || [];
                                    return [4 /*yield*/, buildInclude(includedQuery.$include, includedEt, alias)];
                                case 1:
                                    included = _c.sent();
                                    select = buildSelect(includedQuery.$select, includedEt, included, alias);
                                    if (prop.relation === core_models_1.RelationKind.belongsToMany) {
                                        relationTableAlias = "t" + tableCount;
                                        join = "INNER JOIN " + prop._relationTable + " AS t" + relationTableAlias + "\n                              ON " + relationTableAlias + ".\"" + includedEt.name + "Id\"\n                               = " + relationTableAlias + ".\"" + entityType.name + "Id\"";
                                        select += "\n" + join;
                                    }
                                    else {
                                        thisCol = void 0;
                                        parentCol = void 0;
                                        if (prop.relation === core_models_1.RelationKind.hasOne || prop.relation === core_models_1.RelationKind.hasMany) {
                                            thisCol = "_" + entityType.name + "_" + includedEt.name + "_" + prop.name;
                                            parentCol = parentAlias + "._id";
                                        }
                                        else {
                                            thisCol = "_id";
                                            parentCol = parentAlias + "._" + entityType.name + "_" + includedEt.name + "_" + prop.name;
                                        }
                                        condition = (_a = {}, _a[thisCol] = (_b = {}, _b["$eq"] = "$[" + parentCol + "]", _b), _a);
                                        includedQuery.$where.push(condition);
                                    }
                                    where = buildWhere(includedQuery.$where, includedEt.name);
                                    includedSql = select + where;
                                    joined.push(wrapIncluded(includedSql, alias, key, prop.relation));
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _a = [];
                    for (_b in includedKeys)
                        _a.push(_b);
                    _i = 0;
                    _c.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    key = _a[_i];
                    return [5 /*yield**/, _loop_1(key)];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, joined.join(", ")];
            }
        });
    });
}
function wrapIncluded(sql, alias, key, relationKind) {
    var wrapped = "(SELECT row_to_json(" + alias + ") \nFROM (" + sql + ") AS " + alias + ") as " + key;
    var wrapPaginated = "\n  (SELECT row_to_json(" + alias + ")\n   FROM (SELECT coalesce(array_to_json(array_agg(" + alias + "._row)), '[]'::json) items, coalesce(avg(" + alias + "._count)::int, 0) total\n         FROM (SELECT row_to_json(" + alias + ") _row, COUNT(*) OVER() _count\n               FROM (" + sql + ") AS " + alias + ") AS " + alias + ") AS " + alias + "\n         LIMIT 2 OFFSET 0) AS " + key + "\n  ";
    if (relationKind === core_models_1.RelationKind.hasMany || relationKind === core_models_1.RelationKind.belongsToMany) {
        return wrapPaginated;
    }
    else {
        return wrapped;
    }
}
function buildSelect(columns, entityType, included, alias) {
    columns = columns || [];
    columns.length === 0 && columns.push("*");
    included && columns.push(included);
    var columnStr = columns.join(", ");
    var selectTemplate = 'SELECT %s FROM "%s" AS "%s"';
    return util.format(selectTemplate, columnStr, entityType.name, alias);
}
var paramsCount = 1;
var paramsList = [];
function buildWhere(conditionGroup, root) {
    var buildClauses = function (conditionGroup, root) {
        if (conditionGroup == null)
            return;
        var clauseTemplate = "%s %s %s";
        var clauses = "";
        for (var _i = 0, conditionGroup_1 = conditionGroup; _i < conditionGroup_1.length; _i++) {
            var condition = conditionGroup_1[_i];
            if (Array.isArray(condition)) {
                var or = buildClauses(condition, root);
                clauses += " OR (" + or + ")";
            }
            else {
                var column = Object.keys(condition)[0];
                var operation = condition[column];
                var operator = Object.keys(operation)[0];
                var knexOp = operatorsMap.get(operator);
                var value = operation[operator];
                var match = void 0;
                if (typeof value === "string" && value && !!(match = value.match(/\$\[([^)]+)\]/))) {
                    var splitted = match[1].split(".");
                    var columns2 = splitted.length > 1 ? ["\"" + splitted[0] + "\"", "\"" + splitted[1] + "\""].join(".") : "\"" + splitted[0] + "\"";
                    clauses += " AND " + util.format(clauseTemplate, "\"" + column + "\"", knexOp, columns2);
                }
                else {
                    var param = "$" + paramsCount++;
                    paramsList.push(value);
                    clauses += " AND " + util.format(clauseTemplate, "\"" + column + "\"", knexOp, param);
                }
            }
        }
        return clauses.replace(/^\s(AND|OR)\s/g, "");
    };
    var clauses = buildClauses(conditionGroup, root);
    return "\nWHERE " + clauses;
}
var operatorsMap = new Map([["$eq", "="]]);
try {
    var query = new queryable_1.Queryable(function (query) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, null];
    }); }); });
    var result = query
        .where(function (q) { return q.filter("name", "$eq", "Leandro").$or(function (o) { return o.filter("name", "$eq", "name", true); }); })
        .include("props", function (q) { return q.where(function (w) { return w.filter("name", "$eq", function (c) { return c.name; }); }); })
        .include("_createdBy", function (q) { return q.where(function (f) { return f.filter("name", "$eq", "Leandro"); }); })._query;
    buildQuery(entityType, result)
        .then(function (c) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // const result = await pool.query(`
            //       WITH  a AS (select *, count(*) over (range unbounded preceding)
            //       FROM "EntityProperty")
            // SELECT * from a order by "_id" limit 1 offset 0;
            // `);
            console.log(c);
            return [2 /*return*/];
        });
    }); })["catch"](function (c) { return console.log("Error", c); });
}
catch (error) { }
