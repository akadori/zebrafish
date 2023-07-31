import { Plugin } from "../types";
import http, {
	Server,
	ServerOptions,
	IncomingMessage,
	ServerResponse,
	RequestListener,
} from "http";
import { Socket } from "net";

const originalCreateServer = http.createServer;
let sockets: Array<Socket> = [];
export let closeServer: typeof Server.prototype.close | undefined;

function isOption(arg: unknown): arg is ServerOptions {
	return !!arg && typeof arg === "object";
}

// for overriding http.createServer
function createEasyToStopServer<
	Request extends typeof IncomingMessage = typeof IncomingMessage,
	Response extends typeof ServerResponse = typeof ServerResponse,
>(
	requestListener?: RequestListener<Request, Response>,
): Server<Request, Response>;
function createEasyToStopServer<
	Request extends typeof IncomingMessage = typeof IncomingMessage,
	Response extends typeof ServerResponse = typeof ServerResponse,
>(
	options: ServerOptions<Request, Response>,
	requestListener?: RequestListener<Request, Response>,
): Server<Request, Response>;
function createEasyToStopServer<
	Request extends typeof IncomingMessage = typeof IncomingMessage,
	Response extends typeof ServerResponse = typeof ServerResponse,
>(
	...args:
		| [ServerOptions<Request, Response>, RequestListener<Request, Response>?]
		| [RequestListener<Request, Response>?]
): Server<Request, Response> {
	let server: Server<Request, Response>;
	if (isOption(args[0])) {
		server = originalCreateServer(args[0], args[1]);
	} else {
		server = originalCreateServer(args[0]);
	}
	server.on("connection", (socket) => {
		sockets.push(socket);
	});
	closeServer = server.close.bind(server);
	return server;
}

export const serverPlugin: Plugin = {
    onInit: () => {
        http.createServer = createEasyToStopServer;
    },
    beforeRestart: () => {
        sockets.forEach((socket) => {
            socket.destroy();
        });
        sockets = [];
        closeServer?.();
    }
};