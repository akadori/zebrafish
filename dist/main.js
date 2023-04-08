"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const zodiarg_1 = require("zodiarg");
const parsed = (0, zodiarg_1.parse)({
    // --key value | --key=value
    options: {
        name: zod_1.z.string().describe("input your name"),
        env: zod_1.z.enum(["a", "b"]).describe("env"),
        age: zodiarg_1.asNumberString.default("1").describe("xxx"),
        active: zodiarg_1.asBooleanString.default("false"), // parse as boolean
    },
    // --flagA, --flagB
    flags: {
        dry: zod_1.z.boolean().default(false),
        shortable: zod_1.z.boolean().default(false).describe("shortable example"),
    },
    // ... positional args: miz 10
    args: [
        zod_1.z.string().describe("input your first name"),
        zod_1.z.string().regex(/^\d+$/).transform(Number),
    ],
    // alias map: s => shortable
    alias: {
        s: "shortable",
    },
}, process.argv.slice(2));
main(parsed).catch((err) => {
    console.error(err);
    process.exit(1);
});
function main(input) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Parsed Input", input);
    });
}
