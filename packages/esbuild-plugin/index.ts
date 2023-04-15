import  {
    ZebrafishOptions,
    createZebrafish,
    serverPlugin
 } from "zebrafish"

import type { Plugin, PluginBuild } from "esbuild";


export const buildEsbuildPlugin = (options: ZebrafishOptions): Plugin => {
    const zebrafish = createZebrafish({
        ...options,
        plugins: [
            serverPlugin,
            ...options.plugins || []
        ]
    });
    let isBuilt = false;
    const plugin: Plugin = {
        name: "zebrafish",
        setup(build: PluginBuild) {
            build.onEnd(() => {
                if (!isBuilt) {
                    isBuilt = true;
                    zebrafish.start();
                }
            });
        }
    }
    return plugin;
}