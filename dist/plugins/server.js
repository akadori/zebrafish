"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverPlugin = void 0;
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
exports.serverPlugin = {
    onInit: () => {
        http_1.default.createServer = createEasyToStopServer;
    },
    beforeRestart: () => {
        sockets.forEach((socket) => {
            socket.destroy();
        });
        sockets = [];
        closeServer();
    }
};
