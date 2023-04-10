const Express = require('express');

const app = Express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello000 Wodrld!d');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

const { c } = require("./c");
console.log(`c: ${c} on serve.js`);
const { a } = require("./a");
console.log(`a: ${a} on serve.js`);
