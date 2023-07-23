export * from "./plugins";
import {
	Zebrafish,
	ZebrafishOptions,
} from "./core/zebrafish";
export function runZebrafish(options: ZebrafishOptions): Zebrafish {
	const zebrafish = new Zebrafish(options);
	zebrafish.start();
	return zebrafish;
}
