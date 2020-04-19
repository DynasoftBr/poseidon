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
exports.MongoDbStorage = void 0;
var mongodb_1 = require("mongodb");
var mongodb_storage_collection_1 = require("./mongodb-storage-collection");
var exceptions_1 = require("../../../exceptions");
var logger_1 = require("../../../logger");
var MongoDbStorage = /** @class */ (function () {
    function MongoDbStorage() {
        this.connected = false;
    }
    MongoDbStorage.prototype.connect = function (connetionOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var retries, _a, err_1, delay;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        retries = 0;
                        connetionOptions.retries = connetionOptions.retries || 0;
                        _b.label = 1;
                    case 1:
                        if (!(retries <= connetionOptions.retries && this.connected === false)) return [3 /*break*/, 9];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 8]);
                        _a = this;
                        return [4 /*yield*/, mongodb_1.MongoClient.connect(connetionOptions.url, { useUnifiedTopology: true })];
                    case 3:
                        _a.mongoClient = _b.sent();
                        this.setDatabase(connetionOptions.dbName);
                        this.connected = true;
                        logger_1.logger.info(exceptions_1.SysMsgs.info.connectedToDatabase.message);
                        return [3 /*break*/, 8];
                    case 4:
                        err_1 = _b.sent();
                        if (!(retries < connetionOptions.retries)) return [3 /*break*/, 6];
                        // Retry for configurated times.
                        retries++;
                        // log a warn.
                        logger_1.logger.warn(exceptions_1.SysMsgs.format(exceptions_1.SysMsgs.info.cannotConnectToDatabase, connetionOptions.timeBetweenRetries));
                        delay = function (ms) { return new Promise(function (res) { return setTimeout(res, ms); }); };
                        return [4 /*yield*/, delay(connetionOptions.timeBetweenRetries * 1000)];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 6: throw err_1;
                    case 7: return [3 /*break*/, 8];
                    case 8: return [3 /*break*/, 1];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    MongoDbStorage.prototype.setDatabase = function (name) {
        this.db = this.mongoClient.db(name);
    };
    MongoDbStorage.prototype.collection = function (name) {
        return new mongodb_storage_collection_1.MongoDbStorageCollection(this.db, name);
    };
    return MongoDbStorage;
}());
exports.MongoDbStorage = MongoDbStorage;
