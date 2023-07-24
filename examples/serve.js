const { createServer } = require("node:http");

const requiredTime = Date.now();

const server = createServer((req, res) => {
    res.end(JSON.stringify({
        message: "Server is up and running",
        serverfileRequiredTime: requiredTime,
    }));
});
const test = "teddsdddt3";
const port = Number(process.env.PORT) || 4000;
server.listen(port, () => {
    console.log("Server startded on port:", port);
});

// const { c } = require("./c");
// console.log(`c: ${c} on served.js`);
const { a } = require("./a");
console.log(`a: ${a} on serve.js`);
