import { debugLogger, infoLogger, launchLogger } from "../utils/logger";
import { DependedMap } from "./dependedMap";
import { FileChangeWatcher } from "./fileChangeWatcher";
import { Plugin } from "../types";
import path from "path";

export type ZebrafishOptions = {
	entryPoint: string;
	watchDir: string;
	ignorePatterns?: RegExp[];
	plugins: Plugin[];
};

export class Zebrafish {
	protected dependedMap: DependedMap;
	protected entryPoint: string;
	protected watcher: FileChangeWatcher;
	protected ignorePatterns: RegExp[] | undefined;
	protected plugins: Plugin[] = [];
	protected cwd = process.cwd();

	constructor({
		entryPoint,
		watchDir,
		ignorePatterns,
		plugins,
	}: ZebrafishOptions) {
		const absPath = path.resolve(this.cwd, entryPoint);
		this.entryPoint = absPath;
		this.ignorePatterns = ignorePatterns;
		const absWatchDir = path.resolve(this.cwd, watchDir);
		this.watcher = new FileChangeWatcher(
			absWatchDir,
			this.handleFilesChanged.bind(this),
		);
		this.plugins = plugins || [];
		this.plugins.forEach((plugin) => plugin.onInit?.());
		this.dependedMap = new DependedMap(absPath, ignorePatterns);
	}

	public start(): void {
		launchLogger("starting...");
		this.entry();
		const entryModule = require.cache[require.resolve(this.entryPoint)];
		if (!entryModule) {
			throw new Error(`Entry module ${this.entryPoint} not found`);
		}
		this.dependedMap.load();
		this.watcher.start();
		launchLogger("started");
	}

	protected entry(): void {
		require(this.entryPoint);
	}

	public handleFilesChanged(changedFiles: string[]): void {
		const ancestorPaths = changedFiles
			.map((changedFile) => {
				return (
					this.dependedMap?.findAncestorsRecursively(
						require.resolve(changedFile),
					) || []
				);
			})
			.flat();
		// delete cache
		ancestorPaths.forEach((ancestorPath) => {
			this.deleteCache(ancestorPath);
		});
		this.restart();
		const entryModule = require.cache[require.resolve(this.entryPoint)];
		if (!entryModule) {
			throw new Error(`Entry module ${this.entryPoint} not found`);
		}
		this.dependedMap.reload(this.entryPoint);
	}

	public restart(): void {
		infoLogger("restarting...");
		this.plugins.forEach((plugin) => plugin.beforeRestart?.());
		this.entry();
		this.plugins.forEach((plugin) => plugin.onRestarted?.());
		infoLogger("restarted");
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
		debugLogger("ZebrafishForDebug constructor");
		super(options);
	}
	public start(): void {
		debugLogger("ZebrafishForDebug start");
		super.start();
		debugLogger("ZebrafishForDebug started");
	}

	public restart(): void {
		super.restart();
	}

	public handleFilesChanged(changedFiles: string[]): void {
		debugLogger(`ZebrafishForDebug handleFilesChanged: ${changedFiles.length}`);
		super.handleFilesChanged(changedFiles);
	}

	deleteCache(modulePath: string): void {
		super.deleteCache(modulePath);
	}
}
