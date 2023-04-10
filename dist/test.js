"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zebrafish_1 = require("./core/zebrafish");
const server_1 = require("./plugins/server");
const entryPoint = `${__dirname}/../examples/serve.js`;
const zebrafish = new zebrafish_1.Zebrafish(entryPoint, `${__dirname}/../examples`, undefined, [server_1.serverPlugin]);
zebrafish.start();
