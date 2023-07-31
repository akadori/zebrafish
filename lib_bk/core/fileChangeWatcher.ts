import { debounce } from "../utils/debounce";
import { FSWatcher, watch } from "fs";
import path from "path";

/**
 * FileChangeWatcher watches file changes in a directory.
 * It detects file changes and notifies the listener of the changed files.
 * It also debounces the listener execution to prevent multiple executions when a large number of files are changed at once.
 */
export class FileChangeWatcher {
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
		// FSWatcher executes registered listeners each time a single file change is detected.
		// To prevent multiple reservations of listener execution when a large number of files are changed at once, it uses debouncing.
		const fileChangeHandler = debounce(() => {
			const changedFiles = Array.from(this.changedFiles);
			this.changeListener(changedFiles);
			this.changedFiles.clear();
		}, 200);
		this.watcher.addListener("change", (eventName, filename: string) => {
			if (eventName === "change") {
				// Adding a file before the debounced function is executed prevents the file from being ignored.
				this.changedFiles.add(`${this.watchDirAbsPath}/${filename}`);
				fileChangeHandler();
			}
		});
	}

	public close(): void {
		this.watcher.close();
	}
}
