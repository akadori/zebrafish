import chokidar from 'chokidar';

import { Genealogy } from './genealogy';
import { Plugin } from '../types';
export class Zebrafish {
    private genealogy: Genealogy | undefined;
    private entryPoint: string;
    private watcher: chokidar.FSWatcher;
    private ignorePatterns: RegExp[] | undefined;
    private plugins: Plugin[] = [];
    
    constructor(entryPoint: string, watchDir: string, ignorePatterns?: RegExp[], plugins?: Plugin[]) {
        this.entryPoint = entryPoint;
        this.ignorePatterns = ignorePatterns;
        this.watcher = chokidar.watch(watchDir);
        this.plugins = plugins || [];
        this.plugins.forEach(plugin => plugin.onInit?.());
    }

    public start(): void {
        require(this.entryPoint);
        this.genealogy = new Genealogy(this.entryPoint, this.ignorePatterns);
        this.watcher.on('all', (eventName, path) => {
            if(eventName === 'change') {
                this.plugins.forEach(plugin => plugin.beforeRestart?.());
                const onRestarted = this.genealogy?.onFilesChanged(path);
                require(this.entryPoint);
                this.plugins.forEach(plugin => plugin.onRestarted?.());
                onRestarted?.();
            }
        });
    }
    
    public close(): void {
        this.watcher.close();
    }
}
