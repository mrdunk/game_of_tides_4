// Copyright 2017 duncan law (mrdunk@gmail.com)
var timeStep = 1000 / 60;
var maxFps = 30;
function workerInit() {
    if (typeof (SharedWorker) === "undefined") {
        throw (new Error("Your browser does not support SharedWorkers"));
    }
    var worker = new SharedWorker("worker.js");
    worker.onerror = function (err) {
        console.log(err.message);
        worker.port.close();
    };
    worker.port.start();
    worker.port.postMessage(["ping"]); // Bring up webworker.
    setInterval(function () { worker.port.postMessage(["ping"]); }, 1000);
    return worker;
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
