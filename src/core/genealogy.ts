export type GenealogyMap = Map<string, Set<string>>;

export class Genealogy {
	private genealogy: Map<string, Set<string>> = new Map;
	private ignorePatterns: RegExp | undefined;
	constructor(entryPoint: string, ignorePatterns?: string[]) {
		this.genealogy = this.createReversedDependencyGraph(
			entryPoint,
			ignorePatterns,
		);
		if (ignorePatterns) {
			this.ignorePatterns = new RegExp(
				ignorePatterns.map((pattern) => `(${pattern})`).join("|"),
			);
		}
	}
	createReversedDependencyGraph(
		entryPoint: string,
		ignorePatterns?: string[],
	): Map<string, Set<string>>  {
		const genealogy: GenealogyMap = new Map();
		const absolutePath = require.resolve(entryPoint);
		const entryModule = require.cache[absolutePath];
		if (!entryModule) {
			throw new Error(`Entry module ${entryPoint} not found`);
		}
		let queue = [entryModule];
		while (queue.length) {
			const [current, ...rest] = queue;
			queue = rest;
			const { children, filename: parent } = current;
			// if (ignorePatterns?.some((pattern) => parent.match(pattern))) {
			// 	continue;
			// }
			children.forEach((child) => {

				const { filename: childFilename } = child;
				if (ignorePatterns?.some((pattern) => childFilename.match(pattern))) {
					return;
				}
				const ancestors = genealogy.get(childFilename) || new Set();
				ancestors.add(parent);
				genealogy.set(childFilename, ancestors);
				queue.push(child);
			});
		}
		return genealogy;
	}
	public onFilesChanged (changedFiles: string[]): () => void {
		let queue = [...changedFiles];
		while (queue.length) {
			const [current, ...rest] = queue;
			queue = rest;
			const absolutePath = require.resolve(current);
			if (this.genealogy.has(absolutePath)) {
				const ancestors = this.genealogy.get(absolutePath) || new Set();
				for (const ancestor of ancestors) {
					queue.push(ancestor);
				}
			}
			require.cache[absolutePath] = undefined;
			this.genealogy.delete(absolutePath);
		}

		return () => {
			this.updateGenealogy(changedFiles);
		}
	}

	private updateGenealogy (entryPoints: string[]): void {
		let queue = [...entryPoints];
		while (queue.length) {
			const [current, ...rest] = queue;
			queue = rest;
			const absolutePath = require.resolve(current);
			const currentModule = require.cache[absolutePath];
			if (!currentModule) {
				throw new Error(`Module not found: ${current}`);
			}
			currentModule.children.forEach((child) => {
				const filename = child.filename;
				if (this.ignorePatterns?.test(filename)) {
					return;
				}
				const ancestors = this.genealogy.get(filename) || new Set();
				ancestors.add(absolutePath);
				this.genealogy.set(filename, ancestors);
				queue.push(child.filename);
			});
		}
	}

	getAncestors (absolutePath: string): string[] {
		const ancestors = this.genealogy.get(absolutePath) || new Set();
		return [...ancestors];
	}
}