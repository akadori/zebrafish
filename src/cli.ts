import { ZebrafishOptions,createZebrafish } from "./main";
import { z } from "zod";
import { parse } from "zodiarg";

const parsed = parse(
  {
    // --key value | --key=value
    options: {
      entryPoint: z.string().describe("entry point"),
      watchDir: z.string().describe("watch dir"),
      ignorePatterns: z.array(z.string()).default([]).describe("ignore patterns"),
    },
    // --flagA, --flagB
    flags: {
    },
    // ... positional args: miz 10
    args: [
    ],
    // alias map: s => shortable
    alias: {
      e: 'entryPoint',
      w: 'watchDir',
      i: 'ignorePatterns',
    }
  },
  process.argv.slice(2),
);

type ParsedInput = typeof parsed; // Inferenced by Zod

excute(parsed).catch((err) => {
  console.error(err);
  process.exit(1);
});

async function excute(input: ParsedInput) {
    const zebrafishOptions: ZebrafishOptions = {
        entryPoint: input.options.entryPoint,
        watchDir: input.options.watchDir,
        ignorePatterns: input.options.ignorePatterns.length > 0 ? input.options.ignorePatterns.map((pattern) => new RegExp(pattern)) : undefined,
    };
    const zebrafish = createZebrafish(zebrafishOptions);
    zebrafish.start();
}