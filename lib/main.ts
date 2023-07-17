export * from "./plugins";
import { DebugFish } from "./core/zebrafish";

import { Plugin } from "./plugins";
import { serverPlugin } from "./plugins/server";

export type ZebrafishOptions = {
	  entryPoint: string;
	  watchDir: string;
	  ignorePatterns?: RegExp[];
	  plugins?: Plugin[];
};

export function createZebrafish(options: ZebrafishOptions): DebugFish {
	const zebrafish = new DebugFish(options.entryPoint, options.watchDir, options.ignorePatterns, [serverPlugin]);
	return zebrafish;
};
