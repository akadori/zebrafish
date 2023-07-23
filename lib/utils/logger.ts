import debug from "debug";

const prefix = "zebrafish";
export const debugLogger = debug(`${prefix}:debug`);
export const verboseLogger = debug(`${prefix}:verbose`);

export const mapToMessage = (map: Map<any, any>): string => {
	const entries = Array.from(map.entries());
	return entries.map(([key, value]) => `${key}: ${value}`).join("\n");
};
