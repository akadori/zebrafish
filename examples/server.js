const { createServer } = require("node:http");

const requiredTime = Date.now();

const server = createServer((req, res) => {
    res.end(JSON.stringify({
        message: "Server is up and running",
        serverfileRequiredTime: requiredTime,
    }));
});
const port = Number(process.env.PORT) || 3000
server.listen(port, () => {
    console.log("Server started on port:", port);
});