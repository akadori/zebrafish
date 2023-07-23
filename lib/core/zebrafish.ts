import { debounce } from "../utils/debounce";
import { ReversedModulesMap } from "./reversedDepndenciesMap";
import { Plugin } from "../plugins";
import path from "path";
import { FSWatcher, watch } from "fs";
import { verboseLogger } from "../utils/logger";

class TaskRunner {
	private watcher: FSWatcher;
	private changedFiles: Set<string> = new Set();
	private changeListener: (changedFiles: Array<string>) => void;

	constructor(watchDir: string, changeListener: (changedFiles: Array<string>) => void) {
		this.watcher = watch(path.resolve(process.cwd(), watchDir));
		this.changeListener = changeListener;
	}

	public start(): void {
		const debouncedListener = debounce(() => {
			const changedFiles = Array.from(this.changedFiles);
			this.changeListener(changedFiles);
			this.changedFiles.clear();
		}, 500);
		this.watcher.addListener("change", (_eventType, filename: string) => {
			this.changedFiles.add(filename);
			debouncedListener();
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
		this.taskRunner = new TaskRunner(watchDir, this.handleFileChange.bind(this));
		this.reversedDepndenciesMap = new ReversedModulesMap(
			this.entryPath,
			this.ignorePatterns,
		);
		this.plugins = plugins;
		this.plugins.forEach((plugin) => plugin.onInit?.());
	}

	public start(): void {
		this.runEntryModule();
		this.taskRunner.start();
	}

	protected runEntryModule(): void {
		require(this.entryPath);
	}

	protected handleFileChange(changedFiles: Array<string>): void {
		const ancestorPaths = new Set<string>();
		changedFiles.forEach((changedFile) => {
			(this.reversedDepndenciesMap.findAncestorsRecursively(
				require.resolve(changedFile),
			) || []).forEach((ancestorPath) => ancestorPaths.add(ancestorPath));
		});
		this.restart();
		this.reversedDepndenciesMap.reload(this.entryPath);
	}

	protected restart(): void {
		this.plugins.forEach((plugin) => plugin.beforeRestart?.());
		this.runEntryModule();
		this.plugins.forEach((plugin) => plugin.onRestarted?.());
	}

	public close(): void {
		this.taskRunner.close();
	}

	protected deleteCache(modulePath: string): void {
		require.cache[modulePath] = undefined;
	}
}

