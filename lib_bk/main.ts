export * from "./plugins";
import {
	Zebrafish,
	ZebrafishForDebug,
	ZebrafishOptions,
} from "./core/zebrafish";

export function runZebrafish(options: ZebrafishOptions): Zebrafish {
	const zebrafish = DEBUG_BUILD
		? new ZebrafishForDebug(options)
		: new Zebrafish(options);
	zebrafish.start();
	return zebrafish;
}
