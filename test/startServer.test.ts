import { startServer, restartServer } from "../src/startServer";
import { describe, test, expect, beforeEach } from "vitest";
import fetch from "node-fetch";

beforeEach(() => {
	for (const cacheKey of Object.keys(require.cache)) {
		require.cache[cacheKey] = undefined;
	}
});

describe("startServer", () => {
	test("should start server", async () => {
		const port = "3000";
		process.env.PORT = port;
		await startServer("../examples/server.js");
		const res = (await (await fetch(`http://localhost:${port}`)).json()) as {
			message: string;
			serverfileRequiredTime: number;
		};
		expect(res?.message).toBe("Server is up and running");
	});
});

describe("restartServer", () => {
	test("should restart server", async () => {
		const port = "3001";
		process.env.PORT = port;
		await startServer("../examples/server.js");
		const res1 = (await (await fetch(`http://localhost:${port}`)).json()) as {
			message: string;
			serverfileRequiredTime: number;
		};
		expect(res1?.message).toBe("Server is up and running");
		const path = require.resolve("../examples/server.js");
		require.cache[path] = undefined;
		await restartServer("../examples/server.js", () => {
			console.log("serverWillStart");
		});
		const res2 = (await (await fetch(`http://localhost:${port}`)).json()) as {
			message: string;
			serverfileRequiredTime: number;
		};
		expect(res2?.message).toBe("Server is up and running");
		expect(res2?.serverfileRequiredTime).toBeGreaterThan(
			res1?.serverfileRequiredTime,
		);
	});
});
