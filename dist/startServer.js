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
exports.restartServer = exports.startServer = void 0;
const http_1 = __importDefault(require("http"));
const originalCreateServer = http_1.default.createServer;
let sockets = [];
let closeServer;
function isOption(arg) {
    return !!arg && typeof arg === "object";
}
function createEasyToStopServer(...args) {
    let server;
    if (isOption(args[0])) {
        server = originalCreateServer(args[0], args[1]);
    }
    else {
        server = originalCreateServer(args[0]);
    }
    server.on("connection", (socket) => {
        sockets.push(socket);
    });
    closeServer = server.close.bind(server);
    return server;
}
const startServer = (entryPoint) => __awaiter(void 0, void 0, void 0, function* () {
    http_1.default.createServer = createEasyToStopServer;
    yield require(entryPoint);
});
exports.startServer = startServer;
const restartServer = (entryPoint, serverWillStart) => __awaiter(void 0, void 0, void 0, function* () {
    sockets.forEach((socket) => {
        socket.destroy();
    });
    sockets = [];
    closeServer();
    yield serverWillStart();
    yield require(entryPoint);
});
exports.restartServer = restartServer;
