import debug from "debug";
export const debugLogger = debug("zebrafish:debug");

export const mapToMessage = (map: Map<any, any>): string => {
	const entries = Array.from(map.entries());
	return entries.map(([key, value]) => `${key}: ${value}`).join("\n");
};
