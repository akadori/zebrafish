#!/usr/bin/env node

import { runZebrafish } from "./main";
import { z, ZodString } from "zod";
import { parse } from "zodiarg";
import { Plugin } from "./plugins";
import { serverPlugin } from "./plugins/server";

const options = {
	watchDir: z.string().describe("watch dir"),
	ignorePatterns: z.array(z.string()).default([]).describe("ignore patterns"),
	runHttpServer: z
		.boolean()
		.default(true)
		.describe("run http server. default: true"),
};

const flags = {
};

const args = [z.string().describe("input entry file path")] as [ZodString];

const parsed = parse(
	{
		options,
		flags,
		args,
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
	};
	const zebrafish = runZebrafish(zebrafishOptions);
}

