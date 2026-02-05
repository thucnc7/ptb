const http = require('http');

console.log('Testing connection to http://127.0.0.1:5514/live ...');

const req = http.get('http://127.0.0.1:5514/live', (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    res.on('data', (chunk) => {
        console.log(`BODY: Received chunk of ${chunk.length} bytes`);
        console.log(`FIRST BYTES: ${chunk.slice(0, 20).toString('hex')}`);
        req.destroy(); // Connection successful, stop
    });
});

req.on('error', (e) => {
    console.error(`PROBLEM WITH REQUEST: ${e.message}`);
});

req.setTimeout(5000, () => {
    console.log('REQUEST TIMEOUT');
    req.destroy();
});
