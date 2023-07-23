#!/usr/bin/env node


import {
    Zebrafish,
    ZebrafishOptions,
} from "../lib/core/zebrafish";

const debugLogger = require("debug")("zebrafish:debug");
export class ZebrafishForDebug extends Zebrafish {
	constructor(options: ZebrafishOptions) {
		super(options);
		const readline = require("readline") as typeof import("readline");
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		rl.on("line", this.handleInput.bind(this));
		rl.on("close", () => {
			this.close();
			debugLogger("close");
			process.exit(0);
		});
	}

	handleInput(input: string): void {
		if (input === "s" || input === "status") {
			this.printStatus();
		}
	}

	private printStatus(): void {
		debugLogger("status");
		debugLogger(
			"current map: %O",
			this.reversedDepndenciesMap.getReversedModulesMap(),
		);
		debugLogger(`entryPath: ${this.entryPath}`);
	}

	public start(): void {
		debugLogger("start");
		super.start();
	}

	public restart(): void {
		debugLogger("restart");
		super.restart();
	}

	public handleFileChange(files: Array<string>): void {
		debugLogger(`handleFileChange: ${files}`);
		super.handleFileChange(files);
	}

	deleteCache(modulePath: string): void {
		debugLogger(`deleteCache: ${modulePath}`);
		super.deleteCache(modulePath);
	}
}

export function runZebrafish(options: ZebrafishOptions): Zebrafish {
	const zebrafish = new ZebrafishForDebug(options);
	zebrafish.start();
	return zebrafish;
}


import { z } from "zod";
import { parse } from "zodiarg";
import { Plugin } from "../lib/plugins";
import { serverPlugin } from "../lib/plugins/server";

const parsed = parse(
	{
		// --key value | --key=value
		options: {
			watchDir: z.string().describe("watch dir"),
			ignorePatterns: z
				.array(z.string())
				.default([])
				.describe("ignore patterns"),
			runHttpServer: z
				.boolean()
				.default(true)
				.describe("run http server. default: true"),
		},
		// --flagA, --flagB
		flags: {
			debug: z.boolean().describe("debug mode"),
		},
		args: [z.string().describe("input entry file path")],
		// alias map: s => shortable
		alias: {
			w: "watchDir",
			i: "ignorePatterns",
			s: "runHttpServer",
		},
	},
	process.argv.slice(2),
);

type ParsedInput = typeof parsed; // Inferenced by Zod

excute(parsed).catch((err) => {
	console.error(err);
	process.exit(1);
});

async function excute(input: ParsedInput) {
	const plugins: Plugin[] = [];
	if (input.options.runHttpServer) {
		plugins.push(serverPlugin);
	}
	const zebrafishOptions = {
		entryPath: input.args[0],
		watchDir: input.options.watchDir,
		ignorePatterns:
			input.options.ignorePatterns.length > 0
				? input.options.ignorePatterns.map((pattern) => new RegExp(pattern))
				: undefined,
		plugins,
		debug: input.flags.debug,
	};
	const zebrafish = runZebrafish(zebrafishOptions);
}
