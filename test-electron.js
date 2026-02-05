// Simple test to check electron module
const electron = require('electron');
console.log('electron module:', typeof electron);
console.log('electron.app:', typeof electron.app);
console.log('electron.BrowserWindow:', typeof electron.BrowserWindow);
console.log('electron.ipcMain:', typeof electron.ipcMain);

// Check if we're in the main process
if (electron.app) {
    console.log('Running in main process');
    electron.app.whenReady().then(() => {
        console.log('App is ready!');
        electron.app.quit();
    });
} else {
    console.log('electron.app is undefined - not running in Electron context?');
}
