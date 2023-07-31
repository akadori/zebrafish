import chokidar from 'chokidar';
import { debugLogger, infoLogger } from '../utils/logger';
import { debounce } from '../utils/debounce';
import { Genealogist } from './genealogy';
import { Plugin } from '../plugins';
import path from 'path';

export class Zebrafish {
    protected genealogist: Genealogist | undefined;
    protected entryPoint: string;
    protected watcher: chokidar.FSWatcher;
    protected ignorePatterns: RegExp[] | undefined;
    protected plugins: Plugin[] = [];
    protected cwd = process.cwd();
    
    constructor(entryPoint: string, watchDir: string, ignorePatterns?: RegExp[], plugins?: Plugin[]) {
        const absPath = path.resolve(this.cwd, entryPoint);
        this.entryPoint = absPath;
        this.ignorePatterns = ignorePatterns;
        const absWatchDir = path.resolve(this.cwd, watchDir);
        this.watcher = chokidar.watch(absWatchDir);
        this.plugins = plugins || [];
        this.plugins.forEach(plugin => plugin.onInit?.());
    }

    public start(): void {
        infoLogger("starting...");
        this.entry();
        const entryModule = require.cache[require.resolve(this.entryPoint)];
        if(!entryModule) {
            throw new Error(`Entry module ${this.entryPoint} not found`);
        }
        this.genealogist = Genealogist.wakeUp(entryModule, this.ignorePatterns? { ignorePatterns: this.ignorePatterns } : undefined);
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
        const ancestorPaths = this.genealogist?.findAncestorsRecursively(require.resolve(changedFile)) || [];
        // delete cache
        ancestorPaths.forEach(ancestorPath => {
            this.deleteCache(ancestorPath);
        });
        this.restart();
        const entryModule = require.cache[require.resolve(this.entryPoint)];
        if(!entryModule) {
            throw new Error(`Entry module ${this.entryPoint} not found`);
        }
        this.genealogist?.updateGenealogy(entryModule);
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

export class DebugFish extends Zebrafish {
    private adminServer: any;
    constructor(entryPoint: string, watchDir: string, ignorePatterns?: RegExp[], plugins?: Plugin[]) {
        debugLogger("DebugFish constructor")
        super(entryPoint, watchDir, ignorePatterns, plugins);
    }
    public start(): void {
        debugLogger('DebugFish start');
        super.start();
    }

    public restart(): void {
        super.restart();
    }

    public handleFileChange(changedFile: string): void {
        debugLogger(`DebugFish handleFileChange: ${changedFile}`);
        super.handleFileChange(changedFile);
    }

     deleteCache(modulePath: string): void {
        debugLogger(`DebugFish deleteCache: ${modulePath}`);
        super.deleteCache(modulePath);
    }
}
