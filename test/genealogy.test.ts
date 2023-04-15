import {
    Genealogy,
} from "../lib/core/genealogy";
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
            const entryPoint = `${tempPath}/a.js`;
            require(entryPoint);
            const genealogy = new Genealogy(entryPoint);
            const aModule = require.cache[`${tempPath}/a.js`];
            const bModule = require.cache[`${tempPath}/b.js`];
            const cModule = require.cache[`${tempPath}/c.js`];
            const dummyModule =
                require.cache[`${tempPath}/node_modules/dummy/index.js`];

            expect(genealogy.getAncestors(aModule?.filename || "")).toHaveLength(0);
            expect(genealogy.getAncestors(bModule?.filename || "")).toHaveLength(1);
            expect([...(genealogy.getAncestors(bModule?.filename || "") || [])][0]).toBe(
                aModule?.filename,
            );
            expect(genealogy.getAncestors(cModule?.filename || "")).toHaveLength(2);
            expect([...(genealogy.getAncestors(cModule?.filename || "") || [])]).toContain(
                aModule?.filename,
            );
            expect([...(genealogy.getAncestors(cModule?.filename || "") || [])]).toContain(
                bModule?.filename,
            );
            expect(genealogy.getAncestors(dummyModule?.filename || "")).toHaveLength(1);
        });

        it("create reversed dependency graph without node_modules", () => {
            const entryPoint = `${tempPath}/a.js`;
            require(entryPoint);
            const genealogy = new Genealogy(entryPoint, [
                /.*node_modules.*/,
            ]);
            const aModule = require.cache[`${tempPath}/a.js`];
            const bModule = require.cache[`${tempPath}/b.js`];
            const cModule = require.cache[`${tempPath}/c.js`];
            const dummyModule =
                require.cache[`${tempPath}/node_modules/dummy/index.js`];

            expect(genealogy.getAncestors(aModule?.filename || "")).toHaveLength(0);
            expect(genealogy.getAncestors(bModule?.filename || "")).toHaveLength(1);
            expect(genealogy.getAncestors(cModule?.filename || "")).toHaveLength(2);
            expect(genealogy.getAncestors(dummyModule?.filename || "")).toHaveLength(0);
        });
    });

	describe("onDetectFileChanges", () => {
		it("remove changed files and their parents from cache", () => {
			const entryPoint = `${tempPath}/a.js`;
			require(entryPoint);
            const genealogy = new Genealogy(entryPoint);
			fs.writeFileSync(
				`${tempPath}/b.js`,
				bdotjs.replace("const { c } = require('./c.js');", ""),
			);
            const didStart = genealogy.onFilesChanged(
                `${tempPath}/b.js`,
            )
            require(entryPoint);
            didStart();
			const aModule = require.cache[`${tempPath}/a.js`];
			const bModule = require.cache[`${tempPath}/b.js`];
			const cModule = require.cache[`${tempPath}/c.js`];
			const dummyModule =
				require.cache[`${tempPath}/node_modules/dummy/index.js`];


            expect(genealogy.getAncestors(aModule?.filename || "")).toHaveLength(0);
            expect(genealogy.getAncestors(bModule?.filename || "")).toHaveLength(1);
            expect([...(genealogy.getAncestors(bModule?.filename || "") || [])][0]).toBe(
                aModule?.filename,
            );
            expect(genealogy.getAncestors(cModule?.filename || "")).toHaveLength(1);
            expect([...(genealogy.getAncestors(cModule?.filename || "") || [])]).toContain(
                aModule?.filename,
            );
            expect(genealogy.getAncestors(dummyModule?.filename || "")).toHaveLength(1);
		});
	});
});
