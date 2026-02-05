const http = require('http');

function sendCmd(cmd) {
    return new Promise((resolve) => {
        const url = `http://127.0.0.1:5513/?cmd=${cmd}`;
        console.log(`Sending: ${url}`);
        http.get(url, (res) => {
            console.log(`Cmd ${cmd} Status: ${res.statusCode}`);
            res.resume();
            resolve();
        }).on('error', (e) => {
            console.error(`Cmd error: ${e.message}`);
            resolve();
        });
    });
}

async function testStream() {
    console.log('Testing stream...');
    return new Promise((resolve) => {
        const req = http.get('http://127.0.0.1:5514/live', (res) => {
            console.log(`Stream Status: ${res.statusCode}`);
            console.log(`Headers: ${JSON.stringify(res.headers)}`);
            req.destroy();
            resolve();
        });
        req.setTimeout(3000, () => {
            console.log('Stream TIMEOUT');
            req.destroy();
            resolve();
        });
        req.on('error', (e) => {
            console.log(`Stream Error: ${e.message}`);
            resolve();
        });
    });
}

async function run() {
    await sendCmd('param'); // Check connection
    await sendCmd('LiveViewWnd_Show'); // Try to show window
    await new Promise(r => setTimeout(r, 1000));
    await sendCmd('DoLiveView'); // Activate mode
    await new Promise(r => setTimeout(r, 2000)); // Wait for init
    await testStream();
}

run();
