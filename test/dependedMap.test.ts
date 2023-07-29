import {
    DependedMap,
} from "../lib/core/dependedMap";
import { expect, describe, it, beforeAll, afterAll } from "vitest";
import path from "path";
import fs from "fs";

const dummyNodeModuleIndex = `
    const dummy = 4;
    exports.dummy = dummy;
`;

const dummyPackageJson = `
    {
        "name": "dummy",
        "main": "index.js"
    }
`;

const cdotjs = `
    const dummy = require('dummy');
    const resolved = require.resolve('dummy');
    const c= 1;
    module.exports = {
      resolvedDummyModulePath: resolved,
      c,
    };
`;

const bdotjs = `
    const { c } = require('./c.js');
    const b = 2;
    exports.b = b;
`;

const adotjs = `
    const { b } = require('./b.js');
    const { c, resolvedDummyModulePath } = require('./c.js');
    const a = 3;
    module.exports = {
      a,
      resolvedDummyModulePath,
    }
`;

const tempPath = path.join(__dirname, "temp");

describe("genealogist2", () => {
	beforeAll(() => {
		if (fs.existsSync(tempPath)) {
			fs.rmSync(tempPath, { recursive: true, force: true });
		}
		fs.mkdirSync(tempPath);
		fs.writeFileSync(`${tempPath}/c.js`, cdotjs);
		fs.writeFileSync(`${tempPath}/b.js`, bdotjs);
		fs.writeFileSync(`${tempPath}/a.js`, adotjs);

		fs.mkdirSync(`${tempPath}/node_modules`);
		fs.mkdirSync(`${tempPath}/node_modules/dummy`);
		fs.writeFileSync(
			`${tempPath}/node_modules/dummy/index.js`,
			dummyNodeModuleIndex,
		);
		fs.writeFileSync(
			`${tempPath}/node_modules/dummy/package.json`,
			dummyPackageJson,
		);
	});
	afterAll(() => {
		fs.rmSync(tempPath, { recursive: true, force: true });
	});
    describe("createReversedDependencyGraph", () => {
        it("create reversed dependency graph", () => {
            const entryPath = `${tempPath}/a.js`;
            require(entryPath);
            const dependedMap = new DependedMap(entryPath);
            const aModule = require.cache[`${tempPath}/a.js`];
            const bModule = require.cache[`${tempPath}/b.js`];
            const cModule = require.cache[`${tempPath}/c.js`];
            const dummyModule =
                require.cache[`${tempPath}/node_modules/dummy/index.js`];
            dependedMap.load();

            expect(dependedMap.findAncestorsRecursively(aModule?.filename || "")).toHaveLength(0);
            expect(dependedMap.findAncestorsRecursively(bModule?.filename || "")).toHaveLength(1);
            expect([...(dependedMap.findAncestorsRecursively(bModule?.filename || "") || [])][0]).toBe(
                aModule?.filename,
            );
            expect(dependedMap.findAncestorsRecursively(cModule?.filename || "")).toHaveLength(2);
            expect([...(dependedMap.findAncestorsRecursively(cModule?.filename || "") || [])]).toContain(
                aModule?.filename,
            );
            expect([...(dependedMap.findAncestorsRecursively(cModule?.filename || "") || [])]).toContain(
                bModule?.filename,
            );
            expect(dependedMap.findAncestorsRecursively(dummyModule?.filename || "")).toHaveLength(1);
        });

        it("create reversed dependency graph without node_modules", () => {
            const entryPath = `${tempPath}/a.js`;
            require(entryPath);
            const dependedMap = new DependedMap(entryPath, [
                /.*node_modules.*/,
            ]);
            const aModule = require.cache[`${tempPath}/a.js`];
            const bModule = require.cache[`${tempPath}/b.js`];
            const cModule = require.cache[`${tempPath}/c.js`];
            const dummyModule =
                require.cache[`${tempPath}/node_modules/dummy/index.js`];

            expect(dependedMap.findAncestorsRecursively(aModule?.filename || "")).toHaveLength(0);
            expect(dependedMap.findAncestorsRecursively(bModule?.filename || "")).toHaveLength(1);
            expect(dependedMap.findAncestorsRecursively(cModule?.filename || "")).toHaveLength(2);
            expect(dependedMap.findAncestorsRecursively(dummyModule?.filename || "")).toHaveLength(0);
        });
    });

	describe("onDetectFileChanges", () => {
		it("remove changed files and their parents from cache", () => {
			const entryPath = `${tempPath}/a.js`;
			require(entryPath);
            const dependedMap = new DependedMap(entryPath);
			fs.writeFileSync(
				`${tempPath}/b.js`,
				bdotjs.replace("const { c } = require('./c.js');", ""),
			);
            dependedMap.reload(
                `${tempPath}/b.js`,
            )
            require(entryPath);
			const aModule = require.cache[`${tempPath}/a.js`];
			const bModule = require.cache[`${tempPath}/b.js`];
			const cModule = require.cache[`${tempPath}/c.js`];
			const dummyModule =
				require.cache[`${tempPath}/node_modules/dummy/index.js`];


            expect(dependedMap.findAncestorsRecursively(aModule?.filename || "")).toHaveLength(0);
            expect(dependedMap.findAncestorsRecursively(bModule?.filename || "")).toHaveLength(1);
            expect([...(dependedMap.findAncestorsRecursively(bModule?.filename || "") || [])][0]).toBe(
                aModule?.filename,
            );
            expect(dependedMap.findAncestorsRecursively(cModule?.filename || "")).toHaveLength(1);
            expect([...(dependedMap.findAncestorsRecursively(cModule?.filename || "") || [])]).toContain(
                aModule?.filename,
            );
            expect(dependedMap.findAncestorsRecursively(dummyModule?.filename || "")).toHaveLength(1);
		});
	});
});
