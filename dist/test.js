"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zebrafish_1 = require("./core/zebrafish");
const entryPoint = `${__dirname}/../examples/a.js`;
const zebrafish = new zebrafish_1.Zebrafish(entryPoint, `${__dirname}/../examples`);
zebrafish.start();
