import { Zebrafish } from "./core/zebrafish";

import { Plugin } from "./types";

export type ZebrafishOptions = {
	  entryPoint: string;
	  watchDir: string;
	  ignorePatterns?: RegExp[];
	  plugins?: Plugin[];
};

export function createZebrafish(options: ZebrafishOptions): Zebrafish {
	const zebrafish = new Zebrafish(options.entryPoint, options.watchDir, options.ignorePatterns, options.plugins);
	return zebrafish;
}
