import { FileChangeWatcher } from "./fileChangeWatcher";
import { DependedMap } from "./dependedMap";
import { Plugin } from "../plugins";
import path from "path";
import { debugLogger, infoLogger } from "../utils/logger";
export type ZebrafishOptions = {
	entryPath: string;
	watchDir: string;
	ignorePatterns?: RegExp[];
	plugins: Plugin[];
};

export class Zebrafish {
	protected entryPath: string;
	protected dependedMap: DependedMap;
	protected fileChangeWatcher: FileChangeWatcher;
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
		this.fileChangeWatcher = new FileChangeWatcher(
			watchDir,
			this.handleFilesChanged.bind(this),
		);
		this.dependedMap = new DependedMap(this.entryPath, this.ignorePatterns);
		this.plugins = plugins;
		this.plugins.forEach((plugin) => plugin.onInit?.());
	}

	public start(): void {
		infoLogger("starting...");
		this.entry();
		this.dependedMap.load();
		this.fileChangeWatcher.start();
		infoLogger("started");
	}

	protected entry(): void {
		require(this.entryPath);
	}

	protected handleFilesChanged(changedFiles: Array<string>): void {
		infoLogger(`handleFilesChanged, ${changedFiles.length} files changed`);
		const ancestorPaths = new Set<string>();
		changedFiles.forEach((changedFile) => {
			(
				this.dependedMap.findAncestorsRecursively(
					require.resolve(changedFile),
				) || []
			).forEach((ancestorPath) => ancestorPaths.add(ancestorPath));
		});
		this.deleteCache(Array.from(ancestorPaths));
		infoLogger(`handleFilesChanged, ${ancestorPaths.size} modules deleted`);
		this.restart();
		this.dependedMap.reload(this.entryPath);
	}

	protected restart(): void {
		infoLogger("restarting...");
		this.plugins.forEach((plugin) => plugin.beforeRestart?.());
		this.entry();
		this.plugins.forEach((plugin) => plugin.onRestarted?.());
		infoLogger("restarted");
	}

	public close(): void {
		this.fileChangeWatcher.close();
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
	}

	public start(): void {
		super.start();
	}

	public restart(): void {
		super.restart();
	}

	public handleFilesChanged(files: Array<string>): void {
		super.handleFilesChanged(files);
	}

	deleteCache(modulePaths: string[]): void {
		debugLogger(`deleteCache: ${JSON.stringify(modulePaths)}`);
		super.deleteCache(modulePaths);
	}

	protected entry(): void {
		debugLogger("entry...");
		debugLogger(`entryPath: ${this.entryPath}`);
		super.entry();
		debugLogger("entry done");
	}
}
