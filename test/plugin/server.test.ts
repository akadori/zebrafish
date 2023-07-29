import { serverPlugin, closeServer } from "../../lib/plugins/server";
import { describe, test, expect, beforeEach } from "vitest";
import fetch from "node-fetch";

beforeEach(() => {
	for (const cacheKey of Object.keys(require.cache)) {
		require.cache[cacheKey] = undefined;
	}
});

describe("startServer", () => {
	test("should start server", async () => {
        try {
            const port = "3000";
            process.env.PORT = port;
            serverPlugin.onInit?.();
            await require("../../examples/serve.js");
            const res = (await (await fetch(`http://localhost:${port}`)).json()) as {
                message: string;
                serverfileRequiredTime: number;
            };
            expect(res?.message).toBe("Server is up and running");
        }
        finally {
            await closeServer?.();
        }
	});
});

describe("restartServer", () => {
	test("should restart server", async () => {
        try {
            const port = "3000";
            serverPlugin.onInit?.();
            await require("../../examples/serve.js");
            const res1 = (await (await fetch(`http://localhost:${port}`)).json()) as {
                message: string;
                serverfileRequiredTime: number;
            };
            expect(res1?.message).toBe("Server is up and running");
            const path = require.resolve("../../examples/server.js");
            require.cache[path] = undefined;
            serverPlugin.beforeRestart?.();
            await require("../../examples/serve.js");
            const res2 = (await (await fetch(`http://localhost:${port}`)).json()) as {
                message: string;
                serverfileRequiredTime: number;
            };
            expect(res2?.message).toBe("Server is up and running");
            expect(res2?.serverfileRequiredTime).toBeGreaterThan(
                res1?.serverfileRequiredTime,
            );
        }
        finally {
            await closeServer?.();
        }
	});
});
