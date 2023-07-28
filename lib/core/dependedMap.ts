import { resolve } from "path";

/**
 * A map that records the ancestors of each module.
 * The key is the path of the module, the value is a set of paths of the ancestors.
 * The ancestors are the modules that import the module.
 */
export class DependedMap {
	private map: Map<string, Set<string>>;
	private entryPath: string;
	private ignorePatterns: RegExp | undefined;
	constructor(entryPath: string, ignorePatterns?: RegExp[]) {
		this.entryPath = resolve(process.cwd(), entryPath);
		this.map = new Map();
		this.ignorePatterns = ignorePatterns?.length
			? new RegExp(ignorePatterns.join("|"))
			: new RegExp([/node_modules/, /^[^./]/].join("|"));
	}

	public load(): void {
		const entryModule = require.cache[require.resolve(this.entryPath)];
		if (!entryModule) {
			throw new Error(`Entry module ${this.entryPath} not found`);
		}
		this.recordAncestorsGraph(entryModule);
	}

	private recordAncestorsGraph(
		module: NodeModule,
		seen: Set<string> = new Set(),
	): void {
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
			const ancestors = this.map.get(childFilename) || new Set();
			ancestors.add(parent);
			this.map.set(childFilename, ancestors);
			this.recordAncestorsGraph(child, seen);
		});
	}
	public reload(entryPath: string): void {
		this.map = new Map();
		const entryModule = require.cache[require.resolve(entryPath)];
		if (!entryModule) {
			throw new Error(`Entry module ${entryPath} not found`);
		}
		this.recordAncestorsGraph(entryModule);
	}

	public findAncestorsRecursively(
		absolutePath: string,
		seen: Set<string> = new Set(),
	): string[] {
		if (seen.has(absolutePath)) {
			return [];
		}
		seen.add(absolutePath);

		const ancestors = this.map.get(absolutePath);
		if (!ancestors) {
			return [absolutePath];
		}

		const ancestorsArray = [absolutePath, ...ancestors];
		const ancestorsOfAncestors = ancestorsArray.flatMap((ancestor) => {
			return this.findAncestorsRecursively(ancestor, seen);
		});
		return [...ancestorsArray, ...ancestorsOfAncestors];
	}
}