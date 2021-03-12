const { app, BrowserWindow, screen, Tray, Menu, nativeImage, clipboard } = require('electron')
const path = require('path')
const https = require('@small-tech/https')
const fs = require('fs');
const fetch = require('node-fetch');
const robot = require("robotjs");

let mainWindow, width, height, appIcon;

let pasteMode = 0;

function createWindow(width, height) {
    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        show: true,
        focus: false,
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
    mainWindow.loadFile('index.html')
    mainWindow.setIgnoreMouseEvents(true);
    mainWindow.webContents.on("devtools-opened", () => {
        // mainWindow.setIgnoreMouseEvents(false);
        // mainWindow.webContents.closeDevTools();
        // mainWindow.webContents.openDevTools({
        //     mode: 'detach',
        //     activate: true
        // });
    });
}

class AppIcon {
    constructor() {
        this.tray = new Tray(path.join(__dirname, "assets/appIcon.png"));
        this.init();
    }
    init() {
        const contextMenu = Menu.buildFromTemplate([{
            label: '欢迎使用ARLAB'
        }]);
        this.tray.setContextMenu(contextMenu);
        this.tray.setToolTip('AR LAB');
        // this.tray.popUpContextMenu();
    }
    changeAppIcon(items = []) {
        if (items.length == 0) return;
        let contextMenu = Menu.buildFromTemplate(items);
        this.tray.setContextMenu(contextMenu);
        // this.tray.popUpContextMenu();
    }
    pop() {
        this.tray.popUpContextMenu();
    }
    setImage(base64) {
        this.im = nativeImage.createFromDataURL(base64);
        let resizeImg = this.im.resize({ height: 18 });
        this.tray.setImage(resizeImg);
    }
}



app.whenReady().then(() => {
    appIcon = new AppIcon();
    let size = screen.getPrimaryDisplay().bounds;
    width = parseInt(size.width);
    height = parseInt(size.height);

    createWindow(width, height);

    serverStart();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})



// https服务
function serverStart() {

    const internalIp = require('internal-ip');
    const server = https.createServer(async (req, res) => {

        console.log(req.url)
        if (req.url === '/') {
            const html = fs.readFileSync(path.join(__dirname, './mobile.html'), 'utf8');
            res.writeHead(200, { 'Content-type': 'text/html' });
            res.end(html);
        } else if (req.url === '/clear') {
            mainWindow.webContents.send('clear-all');
            res.writeHead(200, { 'Content-type': 'application/json' });
            res.end(JSON.stringify({ status: 0 }));
        } else if (req.url === '/face') {

            res.writeHead(200, { 'Content-type': 'application/json' });
            try {
                let face = await getBody(req);
                res.end(JSON.stringify(face.result));
            } catch (error) {
                console.log(error)
                res.end(JSON.stringify({ count: 0 }));
            }
        } else if (req.url === '/segment') {

            res.writeHead(200, { 'Content-type': 'application/json' });
            try {
                let segment = await getBody(req);
                // console.log(segment.origin.base64)
                appIcon.setImage('data:image/png;base64,' + segment.result.base64);
                res.end(JSON.stringify(segment.result));
            } catch (error) {
                console.log(error)
                res.end(JSON.stringify({ base64: "" }));
            }
        } else if (req.url === '/project') {

            res.writeHead(200, { 'Content-type': 'application/json' });
            let project = await getBody(req);
            let { x, y } = project.result;
            res.end(JSON.stringify({
                x: parseFloat(x),
                y: parseFloat(y)
            }));

            appIcon.setImage('data:image/png;base64,' + project.origin.result);

            if (pasteMode === 0) mainWindow.webContents.send('new-image', {
                img: project.origin.result,
                size: project.origin.size,
                x: parseFloat(x),
                y: parseFloat(y)
            });

            if (pasteMode === 1) {
                clipboard.writeImage(appIcon.im)
                robot.setMouseDelay(2);
                robot.moveMouse(width * parseFloat(x), height * parseFloat(y));
                robot.mouseClick();

                if(process.platform !== 'darwin'){
                    robot.keyTap("v","control");
                }else{
                    robot.keyTap("v","command");
                }
                
            };

            let items = [
                {
                    label: '拷贝',
                    click: () => clipboard.writeImage(appIcon.im)

                }];
            if (pasteMode === 0) {
                items.push({
                    label: '清空',
                    click: () => mainWindow.webContents.send('clear-all')
                });
                items.push({
                    label: '粘贴模式',
                    click: () => {
                        pasteMode = 1;
                    }
                });
            };
            if(pasteMode===1){
                items.push({
                    label: '悬浮模式',
                    click: () => {
                        pasteMode = 0;
                    }
                });
            };

            appIcon.changeAppIcon(items);

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
        appIcon.changeAppIcon([{
            label: `🚀 🎉 Server running at ${url}`
        }]);
        appIcon.pop();
        console.log(` 🚀 🎉 Server running at ${url}`)
    });
}