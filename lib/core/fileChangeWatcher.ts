import { debounce } from "../utils/debounce";
import chokidar from "chokidar";
export class FileChangeWatcher {
	watchDir: string;
	queue: string[] = [];
	delayedListener: (paths: string[]) => void;

	constructor(watchDir: string, delayedListener: (paths: string[]) => void) {
		this.watchDir = watchDir;
		this.delayedListener = delayedListener;
	}

	public start(): void {
		const watcher = chokidar.watch(this.watchDir, {
			// TODO:
			// ignore all files and directories except javascript files
			// ignored: /^(?!.*js$).+$/ <- it's not working
		});
		const debounceBatchHandler = debounce(() => {
			this.delayedListener(this.queue);
			this.queue = [];
		}, 100);
		watcher.on("change", (path) => {
			// TODO: set in constructor what files to watch. or set in watch ignore patterns
			if (path.endsWith(".js")) {
				this.queue.push(path);
				debounceBatchHandler();
			}
		});
	}

	public close(): void {
		console.log("close watcher");
	}
}
