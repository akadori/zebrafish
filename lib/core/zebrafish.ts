import { debounce } from "../utils/debounce";
import { ReversedModulesMap } from "./reversedDepndenciesMap";
import { Plugin } from "../plugins";
import path from "path";
import { FSWatcher, watch } from "fs";
import { debugLogger, infoLogger } from "../utils/logger";

class TaskRunner {
	private watchDirAbsPath: string;
	private watcher: FSWatcher;
	private changedFiles: Set<string> = new Set();
	private changeListener: (changedFiles: Array<string>) => void;

	constructor(
		watchDir: string,
		changeListener: (changedFiles: Array<string>) => void,
	) {
		this.watchDirAbsPath = path.resolve(process.cwd(), watchDir);
		this.watcher = watch(this.watchDirAbsPath, {
			recursive: true,
		});
		this.changeListener = changeListener;
	}

	public start(): void {
		const debouncedListener = debounce(() => {
			const changedFiles = Array.from(this.changedFiles);
			this.changeListener(changedFiles);
			this.changedFiles.clear();
		}, 200);
		this.watcher.addListener("change", (eventName, filename: string) => {
			if (eventName === "change") {
				this.changedFiles.add(`${this.watchDirAbsPath}/${filename}`);
				debouncedListener();
			}
		});
	}

	public close(): void {
		this.watcher.close();
	}
}

export type ZebrafishOptions = {
	entryPath: string;
	watchDir: string;
	ignorePatterns?: RegExp[];
	plugins: Plugin[];
};

export class Zebrafish {
	protected entryPath: string;
	protected reversedDepndenciesMap: ReversedModulesMap;
	protected taskRunner: TaskRunner;
	protected ignorePatterns: RegExp[] | undefined;
	protected plugins: Plugin[] = [];
	protected cwd = process.cwd();

	constructor({
		entryPath,
		watchDir,
		ignorePatterns,
		plugins,
	}: ZebrafishOptions) {
		this.entryPath = path.resolve(this.cwd, entryPath);
		this.ignorePatterns = ignorePatterns;
		this.taskRunner = new TaskRunner(
			watchDir,
			this.handleFileChange.bind(this),
		);
		this.reversedDepndenciesMap = new ReversedModulesMap(
			this.entryPath,
			this.ignorePatterns,
		);
		this.plugins = plugins;
		this.plugins.forEach((plugin) => plugin.onInit?.());
	}

	public start(): void {
		infoLogger("starting...");
		this.runEntryModule();
		this.reversedDepndenciesMap.load();
		this.taskRunner.start();
	}

	protected runEntryModule(): void {
		infoLogger(`runEntryModule: ${this.entryPath}`);
		require(this.entryPath);
		infoLogger("runEntryModule done");
	}

	protected handleFileChange(changedFiles: Array<string>): void {
		infoLogger(`handleFileChange, ${changedFiles.length} files changed`);
		const ancestorPaths = new Set<string>();
		changedFiles.forEach((changedFile) => {
			(
				this.reversedDepndenciesMap.findAncestorsRecursively(
					require.resolve(changedFile),
				) || []
			).forEach((ancestorPath) => ancestorPaths.add(ancestorPath));
		});
		this.deleteCache(Array.from(ancestorPaths));
		infoLogger(`handleFileChange, ${ancestorPaths.size} modules deleted`);
		this.restart();
		this.reversedDepndenciesMap.reload(this.entryPath);
	}

	protected restart(): void {
		infoLogger("restarting...");
		this.plugins.forEach((plugin) => plugin.beforeRestart?.());
		this.runEntryModule();
		this.plugins.forEach((plugin) => plugin.onRestarted?.());
	}

	public close(): void {
		this.taskRunner.close();
	}

	protected deleteCache(modulePaths: string[]): void {
		modulePaths.forEach((modulePath) => {
			require.cache[modulePath] = undefined;
		});
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
			this.reversedDepndenciesMap.getReversedModulesMap(),
		);
		debugLogger(`entryPath: ${this.entryPath}`);
	}

	public start(): void {
		super.start();
	}

	public restart(): void {
		super.restart();
	}

	public handleFileChange(files: Array<string>): void {
		super.handleFileChange(files);
	}

	deleteCache(modulePaths: string[]): void {
		debugLogger(`deleteCache: ${JSON.stringify(modulePaths)}`);
		super.deleteCache(modulePaths);
	}


	protected runEntryModule(): void {
		super.runEntryModule();
	}
}
