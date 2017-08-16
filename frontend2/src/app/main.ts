// Copyright 2017 duncan law (mrdunk@gmail.com)

declare function SharedWorker(url: string): void;

const timeStep = 1000 / 60;
const maxFps = 30;

function workerInit() {
  if(typeof(SharedWorker) === "undefined") {
    throw(new Error("Your browser does not support SharedWorkers"));
  }
  const worker = new SharedWorker("worker.js");
  worker.onerror = (err) => {
    console.log(err.message);
    worker.port.close();
  };
  worker.port.start();
  worker.port.postMessage(["ping"]);  // Bring up webworker.
  setInterval(() => {worker.port.postMessage(["ping"]);}, 1000);

  return worker;
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

  const menuWidget = new MenuWidget("world_tiles");
  const fpsWidget = new StatusWidget();
  const cameraWidget = new CameraPositionWidget(camera);
  const cursorWidget = new CursorPositionWidget(scene);
  const widgetContainer = document.createElement("div");
  widgetContainer.className = "widget-container";
  widgetContainer.appendChild(menuWidget.element);
  widgetContainer.appendChild(fpsWidget.element);
  widgetContainer.appendChild(cameraWidget.element);
  widgetContainer.appendChild(cursorWidget.element);
  renderer.element.appendChild(widgetContainer);
}


window.onload = () => {
  init();
};

