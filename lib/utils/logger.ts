import debug from "debug";

const prefix = "zebrafish";
export const infoLogger = debug(`${prefix}:info`);
export const debugLogger = debug(`${prefix}:debug`);
