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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const startServer_1 = require("./startServer");
const genealogist_1 = require("genealogist");
const chokidar_1 = __importDefault(require("chokidar"));
const main = (entryPoint, outputDir) => __awaiter(void 0, void 0, void 0, function* () {
    const genealogist = new genealogist_1.Genealogist();
    chokidar_1.default.watch(outputDir).on("all", (eventName, path) => __awaiter(void 0, void 0, void 0, function* () {
        const absolutePath = require.resolve(path);
        yield (0, startServer_1.restartServer)(entryPoint, () => {
            const ancestors = genealogist.getAncestors(absolutePath);
            for (const ancestor of ancestors) {
                require.cache[ancestor] = undefined;
            }
            console.log("serverWillStart");
        });
    }));
    genealogist.watch();
    yield (0, startServer_1.startServer)(entryPoint);
});
