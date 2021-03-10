// Modules to control application life and create native browser window
const { app, BrowserWindow, screen } = require('electron')
const path = require('path')
const https = require('@small-tech/https')
const fs = require('fs');



function createWindow(width, height) {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: width,
        height: height,
        show: true,
        focus: false,
        // resizable: true,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
            enableRemoteModule: true
        }
    })

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')
    mainWindow.setIgnoreMouseEvents(true);
    mainWindow.webContents.on("devtools-opened", () => {
        mainWindow.setIgnoreMouseEvents(false);
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

    let size = screen.getPrimaryDisplay().bounds;
    let width = parseInt(size.width);
    let height = parseInt(size.height);

    createWindow(width, height)

    app.on('activate', function() {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') app.quit()
})


const internalIp = require('internal-ip');
const server = https.createServer((req, res) => {
    const html = fs.readFileSync(path.join(__dirname, './mobile.html'), 'utf8');
    res.writeHead(200, { 'Content-type': 'text/html' });
    res.end(html);
});

const url = `https://${internalIp.v4.sync()}`;

server.listen(443, () => {
    console.log(` 🎉 Server running at ${url}`)
});