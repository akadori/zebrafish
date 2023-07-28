const { createServer } = require("node:http");

const requiredTime = Date.now();

const { c } = require("./c");
const { a } = require("./a");
const m = `c: ${c} on index.js\na: ${a} on index.js`;

const server = createServer((req, res) => {
    res.end(JSON.stringify({
        message: "Server is up and running",
        serverfileRequiredTime: requiredTime,
        messageFromServer: m
    }, null, 2));
});
const port = Number(process.env.PORT) || 4000;
server.listen(port, () => {
    console.log("Server startded on port:", port);
});
