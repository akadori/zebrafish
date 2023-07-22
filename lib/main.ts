export * from "./plugins";
import {
	Zebrafish,
	ZebrafishForDebug,
	ZebrafishOptions,
} from "./core/zebrafish";

export type RunZebrafishOptions = ZebrafishOptions & {
	debug?: boolean;
};

export function runZebrafish(options: RunZebrafishOptions): Zebrafish {
	const zebrafish = options.debug
		? new ZebrafishForDebug(options)
		: new Zebrafish(options);
	zebrafish.start();
	return zebrafish;
}
