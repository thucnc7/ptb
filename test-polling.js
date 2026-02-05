const http = require('http');

async function sendCmd(cmd) {
    return new Promise((resolve) => {
        const url = `http://127.0.0.1:5513/?cmd=${cmd}`;
        http.get(url, (res) => {
            console.log(`Cmd ${cmd} Status: ${res.statusCode}`);
            res.resume();
            resolve();
        });
    });
}

async function getLiveImage() {
    console.log('Fetching live image...');
    return new Promise((resolve) => {
        const url = `http://127.0.0.1:5513/live.jpg`; // Try standard path often used with DCC
        const req = http.get(url, (res) => {
            console.log(`Status: ${res.statusCode}`);
            console.log(`Content-Type: ${res.headers['content-type']}`);
            console.log(`Content-Length: ${res.headers['content-length']}`);
            res.resume();
            resolve();
        }).on('error', () => {
            // Try command variant
            const url2 = `http://127.0.0.1:5513/?cmd=LiveView_GetImage`; // Guessing command names based on old API
            console.log(`Trying alternative: ${url2}`);
            http.get(url2, (res) => {
                console.log(`Alt Status: ${res.statusCode}`);
                console.log(`Alt Content-Type: ${res.headers['content-type']}`);
                res.resume();
                resolve();
            });
        });
    });
}

async function run() {
    await sendCmd('LiveViewWnd_Show');
    await sendCmd('DoLiveView');
    await new Promise(r => setTimeout(r, 2000));
    await getLiveImage();
}

run();
