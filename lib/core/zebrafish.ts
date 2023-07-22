import chokidar from "chokidar";
import { debugLogger } from "../utils/logger";
import { debounce } from "../utils/debounce";
import { ReversedModulesMap } from "./reversedDepndenciesMap";
import { Plugin } from "../plugins";
import path from "path";
// import fs from "fs";

// class Watcher {
// 	private watcher: fs.FSWatcher;
// 	private changeListeners: Set< (eventType: string, filename: string | Buffer) => void> = new Set();
// 	protected cwd = process.cwd();

// 	constructor(watchDir: string, changeListeners: Set< (eventType: string, filename: string | Buffer) => void>) {
// 		this.watcher = fs.watch(path.resolve(this.cwd, watchDir));
// 		this.changeListeners = changeListeners;
// 	}

// 	public start(): void {
// 		this.changeListeners.forEach((listener) => {
// 			this.watcher.prependListener("change", listener);
// 		});
// 	}

// 	public close(): void {
// 		this.watcher.close();
// 	}
// }

export type ZebrafishOptions = {
	entryPath: string;
	watchDir: string;
	ignorePatterns?: RegExp[];
	plugins: Plugin[];
};

export class Zebrafish {
	protected reversedDepndenciesMap: ReversedModulesMap | undefined;
	protected entryPath: string;
	protected watcher: chokidar.FSWatcher;
	protected ignorePatterns: RegExp[] | undefined;
	protected plugins: Plugin[] = [];
	protected cwd = process.cwd();
	private isProcessingFileChange: boolean = false;
	private processingChangedFiles: Set<string> = new Set();

	constructor({
		entryPath,
		watchDir,
		ignorePatterns,
		plugins,
	}: ZebrafishOptions) {
		this.entryPath = path.resolve(this.cwd, entryPath);
		this.ignorePatterns = ignorePatterns;
		this.watcher = chokidar.watch(path.resolve(this.cwd, watchDir));
		this.plugins = plugins;
		this.plugins.forEach((plugin) => plugin.onInit?.());
		this.processingChangedFiles = new Set();
	}

	public start(): void {
		this.runEntryModule();
		this.reversedDepndenciesMap = ReversedModulesMap.init(
			this.entryPath,
			this.ignorePatterns ? { ignorePatterns: this.ignorePatterns } : undefined,
		);
		const debouncedHandleFileChange = debounce(
			this.handleFileChange.bind(this),
			500,
		);
		this.watcher.on("all", (eventName, path) => {
			if (eventName === "change") {
				this.processingChangedFiles.add(path);
				debouncedHandleFileChange();
			}
		});
	}

	protected runEntryModule(): void {
		require(this.entryPath);
	}

	public handleFileChange(): void {
		if (this.isProcessingFileChange) {
			return;
		}
		this.isProcessingFileChange = true;
		const changedFiles = Array.from(this.processingChangedFiles);
		this.processingChangedFiles.clear();
		changedFiles.forEach((changedFile) => {
			const ancestorPaths =
				this.reversedDepndenciesMap?.findAncestorsRecursively(
					require.resolve(changedFile),
				) || [];
			// delete cache
			ancestorPaths.forEach((ancestorPath) => {
				this.deleteCache(ancestorPath);
			});
		});
		this.restart();
		this.reversedDepndenciesMap?.reload(this.entryPath);
		this.isProcessingFileChange = false;
	}

	public restart(): void {
		this.plugins.forEach((plugin) => plugin.beforeRestart?.());
		require(this.entryPath);
		this.plugins.forEach((plugin) => plugin.onRestarted?.());
	}

	public close(): void {
		this.watcher.close();
	}

	protected deleteCache(modulePath: string): void {
		require.cache[modulePath] = undefined;
	}
}

export class ZebrafishForDebug extends Zebrafish {
	constructor(options: ZebrafishOptions) {
		super(options);
		const readline = require("readline") as typeof import("readline");
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		rl.on("line", this.handleInput.bind(this));
		rl.on("close", () => {
			this.close();
			debugLogger("close");
			process.exit(0);
		});
	}

	handleInput(input: string): void {
		if (input === "s" || input === "status") {
			this.printStatus();
		}
	}

	private printStatus(): void {
		debugLogger("status");
		debugLogger(
			"current map: %O",
			this.reversedDepndenciesMap?.getReversedModulesMap(),
		);
		debugLogger(`entryPath: ${this.entryPath}`);
		debugLogger(`watchDir: ${JSON.stringify(this.watcher.getWatched())}`);
	}

	public start(): void {
		debugLogger("start");
		super.start();
	}

	public restart(): void {
		debugLogger("restart");
		super.restart();
	}

	public handleFileChange(): void {
		debugLogger(`handleFileChange`);
		super.handleFileChange();
	}

	deleteCache(modulePath: string): void {
		debugLogger(`deleteCache: ${modulePath}`);
		super.deleteCache(modulePath);
	}
}
