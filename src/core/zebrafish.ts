import chokidar from 'chokidar';

import { Genealogy } from './genealogy';

export class Zebrafish {
    private genealogy: Genealogy | undefined;
    private entryPoint: string;
    private watcher: chokidar.FSWatcher;
    private ignorePatterns: RegExp[] | undefined;
    
    constructor(entryPoint: string, watchDir: string, ignorePatterns?: RegExp[]) {
        this.entryPoint = entryPoint;
        this.ignorePatterns = ignorePatterns;
        this.watcher = chokidar.watch(watchDir);
    }

    public start(): void {
        require(this.entryPoint);
        this.genealogy = new Genealogy(this.entryPoint, this.ignorePatterns);
        this.watcher.on('all', (eventName, path) => {
            if(eventName === 'change') {
                const absolutePath = require.resolve(path);
                const onRestarted = this.genealogy?.onFilesChanged([absolutePath]);
                require(this.entryPoint);
                onRestarted?.();
            }
        });
    }
    
    public close(): void {
        this.watcher.close();
    }
}
