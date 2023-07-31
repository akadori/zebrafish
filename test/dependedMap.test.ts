import {
    DependedMap,
} from "../lib/core/dependedMap";
import { expect, describe, it, beforeAll, afterAll } from "vitest";
import path from "path";
import fs from "fs";

const dataPath = path.join(__dirname, "data");
const tempPath = path.join(__dirname, "temp");

describe("dependentMap", () => {
	beforeAll(() => {
		if (fs.existsSync(tempPath)) {
			fs.rmSync(tempPath, { recursive: true, force: true });
		}
        fs.mkdirSync(tempPath);
        fs.copyFileSync(`${dataPath}/a.js`, `${tempPath}/a.js`);
        fs.copyFileSync(`${dataPath}/b.js`, `${tempPath}/b.js`);
        fs.copyFileSync(`${dataPath}/c.js`, `${tempPath}/c.js`);
        fs.mkdirSync(`${tempPath}/node_modules`);
        fs.mkdirSync(`${tempPath}/node_modules/dummy`);
        fs.copyFileSync(`${dataPath}/node_modules/dummy/index.js`, `${tempPath}/node_modules/dummy/index.js`);
        fs.copyFileSync(`${dataPath}/node_modules/dummy/package.json`, `${tempPath}/node_modules/dummy/package.json`);
	});
	afterAll(() => {
		fs.rmSync(tempPath, { recursive: true, force: true });
	});
    describe("load", () => {
        it("create dependency graph", () => {
            const entryPath = `${tempPath}/a.js`;
            require(entryPath);
            const dependedMap = new DependedMap(entryPath);
            const aModule = require.cache[`${tempPath}/a.js`];
            const bModule = require.cache[`${tempPath}/b.js`];
            const cModule = require.cache[`${tempPath}/c.js`];
            const dummyModule =
                require.cache[`${tempPath}/node_modules/dummy/index.js`];
            dependedMap.load();
            console.log(`aModule?.filename: ${aModule?.filename}`)
            console.debug(`dependedMap.findAncestorsRecursively(aModule?.filename || ""): ${[...dependedMap.findAncestorsRecursively(aModule?.filename || "")]}`)
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
