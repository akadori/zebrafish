"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zebrafish = require("../dist/core/zebrafish");
const server = require("../dist/plugins/server");
const entryPoint = `${__dirname}/../examples/serve.js`;
const z = new zebrafish.Zebrafish(entryPoint, `${__dirname}/../examples`, undefined, [server.serverPlugin]);
z.start();
