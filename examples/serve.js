const { createServer } = require("node:http");

const requiredTime = Date.now();

const { c } = require("./c");
const { a } = require("./a");
const m = `c: ${c} on index.js\na: ${a} on index.js`;


const fetchServerInfoHtml = `
<script>
    const fetchServerInfo = async () => {
        const res = await fetch("/serverinfo");
        const data = await res.json();
        console.log(data);
        const serverInfo = document.getElementById("serverInfo");
        serverInfo.innerHTML = Object.entries({
            ...data,
            fetchedAt: new Date().toLocaleString()
        }).map(([key, value]) => {
            return \`<p>\${key}: \${value}</p>\`;
        }).join("");
    }
</script>
`;

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Server is up and running</title>
</head>
<body>
    <h1>Server is up and running</h1>
    <p>Serverfile required time: ${requiredTime}</p>
    <p>Message from servder: ${m}</p>
    <button onclick="fetchServerInfo()">Fetch server info</button>
    <div id="serverInfo"></div>
    ${fetchServerInfoHtml}
</body>
</html>
`;


const server = createServer((req, res) => {
    if(req.url === "/serverinfo") {
        res.writeHead(200, {
            "Content-Type": "application/json"
        });
        res.end(JSON.stringify({
            requiredTime,
            m
        }));
    }
    else {
        res.writeHead(200, {
            "Content-Type": "text/html"
        });
        res.end(html);
    }
});
const port = Number(process.env.PORT) || 4000;
server.listen(port, () => {
    console.log("Server startded on port:", port);
});
