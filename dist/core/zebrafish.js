"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Zebrafish = void 0;
const chokidar_1 = __importDefault(require("chokidar"));
const genealogy_1 = require("./genealogy");
class Zebrafish {
    constructor(entryPoint, watchDir, ignorePatterns, plugins) {
        this.plugins = [];
        this.entryPoint = entryPoint;
        this.ignorePatterns = ignorePatterns;
        this.watcher = chokidar_1.default.watch(watchDir);
        this.plugins = plugins || [];
        this.plugins.forEach(plugin => { var _a; return (_a = plugin.onInit) === null || _a === void 0 ? void 0 : _a.call(plugin); });
    }
    start() {
        require(this.entryPoint);
        this.genealogy = new genealogy_1.Genealogy(this.entryPoint, this.ignorePatterns);
        this.watcher.on('all', (eventName, path) => {
            var _a;
            if (eventName === 'change') {
                this.plugins.forEach(plugin => { var _a; return (_a = plugin.beforeRestart) === null || _a === void 0 ? void 0 : _a.call(plugin); });
                const onRestarted = (_a = this.genealogy) === null || _a === void 0 ? void 0 : _a.onFilesChanged(path);
                require(this.entryPoint);
                this.plugins.forEach(plugin => { var _a; return (_a = plugin.onRestarted) === null || _a === void 0 ? void 0 : _a.call(plugin); });
                onRestarted === null || onRestarted === void 0 ? void 0 : onRestarted();
            }
        });
    }
    close() {
        this.watcher.close();
    }
}
exports.Zebrafish = Zebrafish;
