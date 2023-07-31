export * from "./plugins";
import {
	Zebrafish,
	ZebrafishForDebug,
	ZebrafishOptions,
} from "./core/zebrafish";

import {
	infoLogger,
} from "./utils/logger";

export function runZebrafish(options: ZebrafishOptions): Zebrafish {
	infoLogger(`zebrafish version:${VERSION} running...`);
	const zebrafish = DEBUG_BUILD
		? new ZebrafishForDebug(options)
		: new Zebrafish(options);
	zebrafish.start();
	return zebrafish;
}