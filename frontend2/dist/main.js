// Copyright 2017 duncan law (mrdunk@gmail.com)
var timeStep = 1000 / 60;
var maxFps = 30;
var workerType;
function workerInit() {
    var worker;
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
    worker.onerror = function (err) {
        console.log(err.message);
        worker.port.close();
    };
    var w = worker.port || worker;
    w.postMessage(["ping"]); // Bring up webworker.
    setInterval(function () { w.postMessage(["ping"]); }, 1000);
    return w;
}
function init() {
    var worker = workerInit();
    var camera = new Camera("camera_1");
    var scene = new Scene("mesh1", worker);
    var renderer = new Renderer("renderer1");
    renderer.setScene(scene);
    renderer.setCamera(camera);
    MainLoop.renderers.push(renderer);
    MainLoop.startRendering();
    var keyboard = new UIKeyboard();
    var mouse = new UIMouse();
    var browserInfo = new BrowserInfo();
    var menuWidget = new MenuWidget("world_tiles");
    var fpsWidget = new StatusWidget();
    var cameraWidget = new CameraPositionWidget(camera);
    var cursorWidget = new CursorPositionWidget(scene);
    var browserInfoWidget = new BrowserInfoWidget(browserInfo);
    var widgetContainer = document.createElement("div");
    widgetContainer.className = "widget-container";
    widgetContainer.appendChild(menuWidget.element);
    widgetContainer.appendChild(fpsWidget.element);
    widgetContainer.appendChild(cameraWidget.element);
    widgetContainer.appendChild(cursorWidget.element);
    widgetContainer.appendChild(browserInfoWidget.element);
    renderer.element.appendChild(widgetContainer);
}
window.onload = function () {
    init();
};
