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

	/**
	 * @param absolutePath
	 * @param seen
	 * @returns [absolutePath, ...ancestors, ...ancestorsOfAncestors]
	 * @note Return always includes the absolutePath itself.
	 */
	public findAncestorsRecursively(
		absolutePath: string,
		seen: Set<string> = new Set(),
	): [string, ...string[]] {
		if (seen.has(absolutePath)) {
			return [absolutePath];
		}
		seen.add(absolutePath);

		const ancestors = this.map.get(absolutePath);
		if (!ancestors) {
			return [absolutePath];
		}

		const ancestorsArray: [string, ...string[]] = [absolutePath, ...ancestors];
		const ancestorsOfAncestors = ancestorsArray.flatMap((ancestor) => {
			return this.findAncestorsRecursively(ancestor, seen);
		});
		return [...ancestorsArray, ...ancestorsOfAncestors];
	}
}

type OriginNode<KeyName extends string, ChildrenKeyName extends string> = {
	[Key in KeyName]: string;
} & {
	[Key2 in ChildrenKeyName]: Array<OriginNode<KeyName, ChildrenKeyName>>;
};

class EdgeFlippedNodeMap<
	KeyName extends string,
	ChildrenKeyName extends string,
> {
	private map: Map<string, Set<string>>;
	private key: KeyName;
	private childrenKey: ChildrenKeyName;
	private ignorePattern: RegExp | undefined;

	constructor(
		key: KeyName,
		childrenKey: ChildrenKeyName,
		root: OriginNode<KeyName, ChildrenKeyName>,
		ignorePattern: RegExp,
	) {
		this.map = new Map();
		this.key = key;
		this.childrenKey = childrenKey;
		this.ignorePattern = ignorePattern;
		this.flipEdge(root);
	}

	private flipEdge<T extends OriginNode<KeyName, ChildrenKeyName>>(
		node: T,
		seen: Set<string> = new Set(),
	): void {
		const { [this.key]: key, [this.childrenKey]: children } = node;
		if (seen.has(key)) {
			return;
		}
		seen.add(key);
		children.forEach((child) => {
			if (this.ignorePattern?.test(child[this.key])) {
				return;
			}
			const { [this.key]: childKey } = child;
			const parents = this.map.get(childKey) || new Set();
			parents.add(key);
			this.map.set(childKey, parents);
			this.flipEdge(child, seen);
		});
	}

	public findAllNodeKeysToRoot(
		key: string,
		seen: Set<string> = new Set(),
	): [string, ...string[]] {
		seen.add(key);
		const keys: [string] = [key];
		const parents = this.map.get(key);
		if (!parents) {
			return keys;
		}
		const parentKeys = Array.from(parents);
		const parentKeysToRoot = parentKeys.flatMap((parentKey) => {
			if (seen.has(parentKey)) {
				return [];
			}
			return this.findAllNodeKeysToRoot(parentKey, seen);
		});
		return [...keys, ...parentKeysToRoot];
	}
}

export class DependedMap2 {
	private map: EdgeFlippedNodeMap<"filename", "children">;
	private entryPath: string;
	constructor(entryPath: string, ignorePatterns?: RegExp[]) {
		this.entryPath = resolve(process.cwd(), entryPath);
		const entryModule = require.cache[require.resolve(this.entryPath)];
		if (!entryModule) {
			throw new Error(`Entry module ${this.entryPath} not found`);
		}
		this.map = new EdgeFlippedNodeMap(
			"filename",
			"children",
			entryModule,
			new RegExp([/node_modules/, /^[^./]/].join("|")),
		);
	}

	public reload(): void {
		const entryModule = require.cache[require.resolve(this.entryPath)];
		if (!entryModule) {
			throw new Error(`Entry module ${this.entryPath} not found`);
		}
		this.map = new EdgeFlippedNodeMap(
			"filename",
			"children",entryModule,
			new RegExp([/node_modules/, /^[^./]/].join("|")),
		);
	}

	public findAllDependsOn(absolutePath: string): [string, ...string[]] {
		return this.map.findAllNodeKeysToRoot(absolutePath);
	}
}
