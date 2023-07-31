#!/usr/bin/env node

import { runZebrafish } from "./main";
import { Command } from "commander";
import { Plugin } from "./plugins";
import { serverPlugin } from "./plugins/server";

const program = new Command();
program
	.name("zebrafish")
	.description("Node.js hot module replacement tool")
	.version(VERSION);
program.argument("<entry>", "entry file path");
program.option("-w, --watch-dir <dir>", "watch dir");
program.option(
	"-i, --ignore-patterns <patterns>",
	"ignore patterns",
	(v) => v.split(","),
	[],
);
program.option("-s, --run-http-server", "run http server", true);
program.parse(process.argv);

excute({
	args: program.args,
	options: program.opts(),
}).catch((err) => {
	console.error(err);
	process.exit(1);
});

async function excute(input: {
	args: string[];
	options: {
		watchDir: string;
		ignorePatterns: string[];
		runHttpServer: boolean;
	};
}) {
	const plugins: Plugin[] = [];
	if (input.options.runHttpServer) {
		plugins.push(serverPlugin);
	}
	const zebrafishOptions = {
		entryPoint: input.args[0],
		watchDir: input.options.watchDir,
		ignorePatterns:
			input.options.ignorePatterns.length > 0
				? input.options.ignorePatterns.map((pattern) => new RegExp(pattern))
				: undefined,
		plugins,
	};
	runZebrafish(zebrafishOptions);
}