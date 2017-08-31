// Copyright 2017 duncan law (mrdunk@gmail.com)
const timeStep = 1000 / 60;
let maxFps = 30;
let workerType;
function workerInit() {
    let worker;
    console.log("workerInit()");
    if (window.SharedWorker !== undefined) {
        console.log("Spawining SharedWorker");
        workerType = "SharedWorker";
        worker = new SharedWorker("worker.js");
        worker.port.start();
    }
    else if (window.Worker !== undefined) {
        console.log("Spawining Worker");
        workerType = "Worker";
        worker = new Worker("worker.js");
    }
    else {
        throw (new Error("Your browser does not support Workers"));
    }
    worker.onerror = (err) => {
        console.log(err.message);
        worker.port.close();
    };
    const w = worker.port || worker;
    w.postMessage(["ping"]); // Bring up webworker.
    setInterval(() => { w.postMessage(["ping"]); }, 1000);
    return w;
}
function init() {
    const worker = workerInit();
    const camera = new Camera("camera_1");
    const scene = new Scene("mesh1", worker);
    const renderer = new Renderer("renderer1");
    renderer.setScene(scene);
    renderer.setCamera(camera);
    MainLoop.renderers.push(renderer);
    MainLoop.startRendering();
    const keyboard = new UIKeyboard();
    const mouse = new UIMouse();
    const browserInfo = new BrowserInfo();
    const menuWidget = new MenuWidget("world_tiles");
    const fpsWidget = new StatusWidget();
    const cameraWidget = new CameraPositionWidget(camera);
    const cursorWidget = new CursorPositionWidget(scene);
    const browserInfoWidget = new BrowserInfoWidget(browserInfo);
    const loginWidget = new LoginWidget(browserInfo);
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "widget-container";
    widgetContainer.appendChild(menuWidget.element);
    widgetContainer.appendChild(fpsWidget.element);
    widgetContainer.appendChild(cameraWidget.element);
    widgetContainer.appendChild(cursorWidget.element);
    widgetContainer.appendChild(browserInfoWidget.element);
    widgetContainer.appendChild(loginWidget.element);
    renderer.element.appendChild(widgetContainer);
}
window.onload = () => {
    init();
};
