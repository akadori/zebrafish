import chokidar from 'chokidar';
import { debugLogger, infoLogger } from '../utils/logger';
import { debounce } from '../utils/debounce';
import { DependedMap } from './dependedMap';
import { Plugin } from '../plugins';
import path from 'path';

export type ZebrafishOptions = {
    entryPoint: string;
    watchDir: string;
    ignorePatterns?: RegExp[];
    plugins: Plugin[];
};

export class Zebrafish {
    protected dependedMap: DependedMap;
    protected entryPoint: string;
    protected watcher: chokidar.FSWatcher;
    protected ignorePatterns: RegExp[] | undefined;
    protected plugins: Plugin[] = [];
    protected cwd = process.cwd();
    
    constructor({
        entryPoint,
        watchDir,
        ignorePatterns,
        plugins,
    } : ZebrafishOptions ) {
        const absPath = path.resolve(this.cwd, entryPoint);
        this.entryPoint = absPath;
        this.ignorePatterns = ignorePatterns;
        const absWatchDir = path.resolve(this.cwd, watchDir);
        this.watcher = chokidar.watch(absWatchDir);
        this.plugins = plugins || [];
        this.plugins.forEach(plugin => plugin.onInit?.());
        this.dependedMap = new DependedMap(absPath, ignorePatterns);
    }

    public start(): void {
        infoLogger("starting...");
        this.entry();
        const entryModule = require.cache[require.resolve(this.entryPoint)];
        if(!entryModule) {
            throw new Error(`Entry module ${this.entryPoint} not found`);
        }
        this.dependedMap.load();
        const debouncedHandleFileChange = debounce(this.handleFileChange.bind(this), 100);
        this.watcher.on('all', (eventName, path) => {
            if(eventName === 'change') {
                debouncedHandleFileChange(path);
            }
        });
    }

	protected entry(): void {
        require(this.entryPoint);
	}

    public handleFileChange (changedFile: string): void {
        const ancestorPaths = this.dependedMap?.findAncestorsRecursively(require.resolve(changedFile)) || [];
        // delete cache
        ancestorPaths.forEach(ancestorPath => {
            this.deleteCache(ancestorPath);
        });
        this.restart();
        const entryModule = require.cache[require.resolve(this.entryPoint)];
        if(!entryModule) {
            throw new Error(`Entry module ${this.entryPoint} not found`);
        }
        this.dependedMap.reload(this.entryPoint);
    }

        

    public restart(): void {
		infoLogger("restarting...");
        this.plugins.forEach(plugin => plugin.beforeRestart?.());
        this.entry();
        this.plugins.forEach(plugin => plugin.onRestarted?.());
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
        debugLogger("ZebrafishForDebug constructor")
        super(options);
    }
    public start(): void {
        debugLogger('ZebrafishForDebug start');
        super.start();
    }

    public restart(): void {
        super.restart();
    }

    public handleFileChange(changedFile: string): void {
        debugLogger(`ZebrafishForDebug handleFileChange: ${changedFile}`);
        super.handleFileChange(changedFile);
    }

     deleteCache(modulePath: string): void {
        debugLogger(`ZebrafishForDebug deleteCache: ${modulePath}`);
        super.deleteCache(modulePath);
    }
}
