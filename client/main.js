const { app, BrowserWindow, screen } = require('electron')
const path = require('path')
const https = require('@small-tech/https')
const fs = require('fs');
const fetch = require('node-fetch');


let mainWindow;

function createWindow(width, height) {
    // Create the browser window.
    mainWindow = new BrowserWindow({
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
            //开启nodejs支持
            nodeIntegration: true,
            //开启AI功能
            experimentalFeatures: true,
            //开启渲染进程调用remote
            enableRemoteModule: true,
            webviewTag: true,
            devTools: true,
            contextIsolation: false
        }
    });
    // and load the index.html of the app.
    mainWindow.loadFile('index.html')
    mainWindow.setIgnoreMouseEvents(true);
    mainWindow.webContents.on("devtools-opened", () => {
        // mainWindow.setIgnoreMouseEvents(false);
    });
}

app.whenReady().then(() => {

    let size = screen.getPrimaryDisplay().bounds;
    let width = parseInt(size.width);
    let height = parseInt(size.height);

    createWindow(width, height)

    app.on('activate', function() {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') app.quit()
})


const internalIp = require('internal-ip');
const server = https.createServer(async(req, res) => {

    if (req.url === '/') {
        const html = fs.readFileSync(path.join(__dirname, './mobile.html'), 'utf8');
        res.writeHead(200, { 'Content-type': 'text/html' });
        res.end(html);
    } else if (req.url === '/segment') {
        console.log('segment')
        res.writeHead(200, { 'Content-type': 'application/json' });
        try {
            let segment = await getBody(req);
            res.end(JSON.stringify(segment.result));
        } catch (error) {
            console.log(error)
            res.end(JSON.stringify({ base64: "" }));
        }
    } else if (req.url === '/project') {
        console.log('project')
        res.writeHead(200, { 'Content-type': 'application/json' });
        let project = await getBody(req);
        let { x, y } = project.result;
        res.end(JSON.stringify({
            x: parseFloat(x),
            y: parseFloat(y)
        }));
        mainWindow.webContents.send('new-image', {
            img: project.origin.result,
            size: project.origin.size,
            x: parseFloat(x),
            y: parseFloat(y)
        });
    }

    // else if(req.url==='/fabric.js'){
    //     res.writeHead(200, {'Content-Type': 'application/javascript'});
    //     res.end(fs.readFileSync(path.join(__dirname,'./node_modules/fabric-pure-browser/dist/fabric.min.js')));
    // }

});


async function getBody(req) {
    let body = [];
    return new Promise((resolve, reject) => {
        req.on('data', chunk => {
            body.push(chunk);
        }).on('end', () => {
            body = JSON.parse(Buffer.concat(body).toString());
            // console.log(JSON.stringify(body))
            fetch('http://0.0.0.0:8891' + req.url, {
                    method: 'post',
                    body: JSON.stringify(body),
                    headers: { 'Content-Type': 'application/json' },
                })
                .then(s => s.json())
                .then(json => resolve({
                    origin: body,
                    result: json
                }));
        });
    })
}


const url = `https://${internalIp.v4.sync()}`;

server.listen(443, () => {
    console.log(` 🚀 🎉 Server running at ${url}`)
});