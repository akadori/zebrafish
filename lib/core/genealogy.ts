import { debugLogger } from "../utils/logger";

/**
 * ファイルの依存関係を記憶するクラス
 * 子が親を知っている形で記憶する
 */
export class Genealogist {
	private genealogy: Map<string, Set<string>>;
	private ignorePatterns: RegExp | undefined;
	constructor(ignorePatterns?: RegExp[]) {
		this.genealogy = new Map();
		this.ignorePatterns = ignorePatterns?.length ? new RegExp(ignorePatterns.join("|")) : undefined;
	}

	public static wakeUp(entryModule: NodeModule, options?: { ignorePatterns?: RegExp[] }): Genealogist {
		// option の ignorePatterns に設定がない場合、node_modules を無視する
		// NOTE: "." もしくは "/" から始まるファイルパス以外は無視する
		const ignorePatterns = options?.ignorePatterns?.length ? options.ignorePatterns : [/node_modules/, /^[^./]/];
		const genealogist = new Genealogist(ignorePatterns);
		genealogist.recordAncestorsGraph(entryModule);
		return genealogist;
	}

	private recordAncestorsGraph(module: NodeModule, seen: Set<string> = new Set()): void {
		const { children, filename: parent } = module;
		if (seen.has(parent)) {
			return;
		}
		seen.add(parent);
		children.forEach((child) => {
			const { filename: childFilename } = child;
			const ancestors = this.genealogy.get(childFilename) || new Set();
			ancestors.add(parent);
			this.genealogy.set(childFilename, ancestors);
			this.recordAncestorsGraph(child, seen);
		});
	}

	/**
	 * もう一回作り直す。
	 * ちょっと細かいことは考えずに、とりあえず全部消して作り直す。
	 */
	public updateGenealogy(entryModule: NodeModule): void {
		this.genealogy = new Map();
		this.recordAncestorsGraph(entryModule);
	}

	public findAncestorsRecursively(absolutePath: string, seen: Set<string> = new Set()): string[] {
		if (seen.has(absolutePath)) {
			return [];
		}
		seen.add(absolutePath);

		const ancestors = this.genealogy.get(absolutePath);
		if (!ancestors) {
			return [absolutePath]
		}

		const ancestorsArray = [absolutePath, ...ancestors];
		const ancestorsOfAncestors = ancestorsArray.flatMap((ancestor) => {
			return this.findAncestorsRecursively(ancestor, seen);
		});
		return [...ancestorsArray, ...ancestorsOfAncestors];
	}
	public currentGenealogy(): typeof this.genealogy {
		return this.genealogy;
	}
}