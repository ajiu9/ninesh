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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatDate, getTasksData } from './utils/index';
var uPath = process.env.HOME;
var scopeUrl = fileURLToPath(new URL('.', import.meta.url));
var require = createRequire(scopeUrl);
var configDir = path.join(uPath, '.obsiflow');
var resolve = function (p) { return path.resolve(configDir, p); };
var configPath = resolve('config.json');
var config;
export function run(argsOptions) {
    return __awaiter(this, void 0, void 0, function () {
        function getTargetTemplateData(data) {
            if (target === 'weekly') {
                var time = new Date(now);
                time.setDate(time.getDate() + 7);
                var week = formatDate(time).week;
                data = data.replace(/\{week\}/g, String(week));
            }
            return data;
        }
        var _, $0, params, targetMap, paramsKeys, target, args, now, currentTime, nameEnum, fileName, targetTemplateData, templateData, templatePath;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _ = argsOptions._, $0 = argsOptions.$0, params = __rest(argsOptions, ["_", "$0"]);
                    targetMap = ['empty', 'task', 'daily', 'weekly'];
                    paramsKeys = Object.keys(params);
                    target = 'empty';
                    if (paramsKeys.length === 0)
                        target = 'empty';
                    else if (paramsKeys.length === 1)
                        target = paramsKeys[0];
                    else if (paramsKeys.length > 1)
                        target = paramsKeys.find(function (key) { return targetMap.includes(key); }) || 'empty';
                    args = __rest(argsOptions, []);
                    return [4 /*yield*/, loadConfig()];
                case 1:
                    _b.sent();
                    now = new Date();
                    if (args.next && ['daily', 'saturday', 'sunday'].includes(target))
                        now.setDate(now.getDate() + 1);
                    if (args.next && target === 'weekly')
                        now.setDate(now.getDate() + 7);
                    currentTime = formatDate(now);
                    nameEnum = {
                        daily: 'time',
                        saturday: 'time',
                        sunday: 'time',
                        weekly: 'week',
                        empty: 'empty',
                        task: 'task',
                    };
                    fileName = currentTime[nameEnum[target]];
                    targetTemplateData = '';
                    if (!(fileName === 'task')) return [3 /*break*/, 2];
                    targetTemplateData = getTasksData(args) || ''; // Provide a default empty string
                    return [3 /*break*/, 5];
                case 2:
                    templateData = '';
                    templatePath = (_a = config[target]) === null || _a === void 0 ? void 0 : _a.template;
                    if (!templatePath) return [3 /*break*/, 4];
                    return [4 /*yield*/, readFile(templatePath, 'utf8')];
                case 3:
                    templateData = (_b.sent());
                    _b.label = 4;
                case 4:
                    targetTemplateData = getTargetTemplateData(templateData);
                    _b.label = 5;
                case 5: return [2 /*return*/, writeFile("".concat(config[target].target, "/").concat(fileName, ".md"), targetTemplateData).then(function () {
                        console.log('Generate file path:', "".concat(config[target].target, "/").concat(fileName, ".md"));
                    })];
            }
        });
    });
}
function loadConfig() {
    return __awaiter(this, void 0, void 0, function () {
        var exit, defaultConfig;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!existsSync(configDir)) return [3 /*break*/, 2];
                    return [4 /*yield*/, mkdir(configDir)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    exit = existsSync(configPath);
                    defaultConfig = {
                        daily: {
                            template: "".concat(uPath, "/Documents/Code/github.com/ajiu9/Notes/Extras/Templates/Calendar\u6A21\u677F/Daily notes\u6A21\u677F.md"),
                            target: "".concat(uPath, "/Documents/Code/github.com/ajiu9/Notes/Calendar/Daily notes"),
                        },
                        saturday: {
                            template: "".concat(uPath, "/Documents/Code/github.com/ajiu9/Notes/Extras/Templates/Calendar\u6A21\u677F/Daily notes\u6A21\u677F.md"),
                            target: "".concat(uPath, "/Documents/Code/github.com/ajiu9/Notes/Calendar/Daily notes"),
                        },
                        sunday: {
                            template: "".concat(uPath, "/Documents/Code/github.com/ajiu9/Notes/Extras/Templates/Calendar\u6A21\u677F/Daily notes\u6A21\u677F.md"),
                            target: "".concat(uPath, "/Documents/Code/github.com/ajiu9/Notes/Calendar/Daily notes"),
                        },
                        weekly: {
                            template: "".concat(uPath, "/Documents/Code/github.com/ajiu9/Notes/Extras/Templates/Calendar\u6A21\u677F/Weekly notes\u6A21\u7248.md"),
                            target: "".concat(uPath, "/Documents/Code/github.com/ajiu9/Notes/Calendar/Weekly"),
                        },
                        empty: {
                            target: "".concat(uPath, "/Documents/Code/github.com/ajiu9/Notes/0-Inbox"),
                        },
                        task: {
                            target: "".concat(uPath, "/Documents/Code/github.com/ajiu9/Notes/0-Inbox"),
                        },
                    };
                    if (!!exit) return [3 /*break*/, 4];
                    return [4 /*yield*/, writeFile(configPath, JSON.stringify(defaultConfig, null, 2))];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [4 /*yield*/, require(resolve('config.json'))];
                case 5:
                    config = _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
