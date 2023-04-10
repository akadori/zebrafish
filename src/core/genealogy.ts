export type GenealogyMap = Map<string, Set<string>>;

export class Genealogy {
	private genealogy: Map<string, Set<string>> = new Map;
	private ignorePatterns: RegExp | undefined;
	constructor(entryPoint: string, ignorePatterns?: RegExp[]) {
		this.ignorePatterns = ignorePatterns?.length ? new RegExp(ignorePatterns.join("|")) : undefined;
		this.createReversedDependencyGraph(
			entryPoint,
		);
	}

	private recordAncestorsGraph(module: NodeModule, seen: Set<string> = new Set()): void {
		const { children, filename: parent } = module;
		if (seen.has(parent)) {
			return;
		}
		seen.add(parent);
		children.forEach((child) => {
			const { filename: childFilename } = child;
			if (this.ignorePatterns?.test(childFilename)) {
				return;
			}
			const ancestors = this.genealogy.get(childFilename) || new Set();
			ancestors.add(parent);
			this.genealogy.set(childFilename, ancestors);
			this.recordAncestorsGraph(child, seen);
		});
	}

	private eraseDescendantsGraph(module: NodeModule, seen: Set<string> = new Set()): void {
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

	private removeAncestorsCache(path: string, seen: Set<string> = new Set()): void {
		if(seen.has(path)) {
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

	private createReversedDependencyGraph(
		entryPoint: string,
	): void  {
		const entryModule = require.cache[require.resolve(entryPoint)];
		if (!entryModule) {
			throw new Error(`Entry module ${entryPoint} not found`);
		}
		this.recordAncestorsGraph(entryModule);
	}
	// キャッシュは祖先方向に、依存関係は子孫方向に削除する
	public onFilesChanged (changedFile: string): () => void {
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
		}
	}

	private updateGenealogy (entryPoint: string): void {
		this.createReversedDependencyGraph(entryPoint);
	}

	public getAncestors (absolutePath: string): string[] {
		const ancestors = this.genealogy.get(absolutePath) || new Set();
		return [...ancestors];
	}
}