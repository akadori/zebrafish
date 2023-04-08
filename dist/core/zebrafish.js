"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Zebrafish = void 0;
const chokidar_1 = __importDefault(require("chokidar"));
const genealogy_1 = require("./genealogy");
class Zebrafish {
    constructor(entryPoint, watchDir, ignorePatterns) {
        this.entryPoint = entryPoint;
        this.ignorePatterns = ignorePatterns;
        this.watcher = chokidar_1.default.watch(watchDir);
    }
    start() {
        require(this.entryPoint);
        this.genealogy = new genealogy_1.Genealogy(this.entryPoint, this.ignorePatterns);
        this.watcher.on('all', (eventName, path) => {
            var _a;
            if (eventName === 'change') {
                const absolutePath = require.resolve(path);
                const onRestarted = (_a = this.genealogy) === null || _a === void 0 ? void 0 : _a.onFilesChanged([absolutePath]);
                require(this.entryPoint);
                onRestarted === null || onRestarted === void 0 ? void 0 : onRestarted();
            }
        });
    }
    close() {
        this.watcher.close();
    }
}
exports.Zebrafish = Zebrafish;
