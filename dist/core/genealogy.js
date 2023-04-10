"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Genealogy = void 0;
class Genealogy {
    constructor(entryPoint, ignorePatterns) {
        this.genealogy = new Map;
        this.ignorePatterns = (ignorePatterns === null || ignorePatterns === void 0 ? void 0 : ignorePatterns.length) ? new RegExp(ignorePatterns.join("|")) : undefined;
        this.createReversedDependencyGraph(entryPoint);
    }
    recordAncestorsGraph(module, seen = new Set()) {
        const { children, filename: parent } = module;
        if (seen.has(parent)) {
            return;
        }
        seen.add(parent);
        children.forEach((child) => {
            var _a;
            const { filename: childFilename } = child;
            if ((_a = this.ignorePatterns) === null || _a === void 0 ? void 0 : _a.test(childFilename)) {
                return;
            }
            const ancestors = this.genealogy.get(childFilename) || new Set();
            ancestors.add(parent);
            this.genealogy.set(childFilename, ancestors);
            this.recordAncestorsGraph(child, seen);
        });
    }
    eraseDescendantsGraph(module, seen = new Set()) {
        const { children, filename: parent } = module;
        if (seen.has(parent)) {
            return;
        }
        seen.add(parent);
        children.forEach((child) => {
            const { filename: childFilename } = child;
            const graph = this.genealogy.get(childFilename);
            if (graph) {
                graph.delete(parent);
            }
        });
    }
    removeAncestorsCache(path, seen = new Set()) {
        if (seen.has(path)) {
            return;
        }
        seen.add(path);
        const ancestors = this.genealogy.get(path);
        if (ancestors) {
            for (const ancestor of ancestors) {
                require.cache[ancestor] = undefined;
                this.removeAncestorsCache(ancestor, seen);
            }
        }
    }
    createReversedDependencyGraph(entryPoint) {
        const entryModule = require.cache[require.resolve(entryPoint)];
        if (!entryModule) {
            throw new Error(`Entry module ${entryPoint} not found`);
        }
        this.recordAncestorsGraph(entryModule);
    }
    // キャッシュは祖先方向に、依存関係は子孫方向に削除する
    onFilesChanged(changedFile) {
        const changedFilePath = require.resolve(changedFile);
        const module = require.cache[changedFilePath];
        if (module) {
            this.eraseDescendantsGraph(module);
        }
        require.cache[changedFilePath] = undefined;
        this.removeAncestorsCache(changedFilePath);
        // キャッシュを削除した後に再度依存関係を作り直す。もう一回enrtypoint から require する必要があることをクライアントに伝えたいが名前が悪い。
        return () => {
            this.updateGenealogy(changedFile);
        };
    }
    updateGenealogy(entryPoint) {
        this.createReversedDependencyGraph(entryPoint);
    }
    getAncestors(absolutePath) {
        const ancestors = this.genealogy.get(absolutePath) || new Set();
        return [...ancestors];
    }
}
exports.Genealogy = Genealogy;
