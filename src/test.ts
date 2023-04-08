import { Zebrafish } from "./core/zebrafish";


const entryPoint = `${__dirname}/../examples/a.js`;

const zebrafish = new Zebrafish(entryPoint, `${__dirname}/../examples`);
zebrafish.start();