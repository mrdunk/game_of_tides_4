// Copyright 2017 duncan law (mrdunk@gmail.com)

declare function SharedWorker(url: string): void;

const timeStep = 1000 / 60;
const maxFps = 30;

function reloadWrapper() {
  location.reload();
}

function init() {
  let terrainGenerator;
  try {
    terrainGenerator = new Module.DataSourceGenerate();
  } catch(err) {
    // Memory still in use from previous page load.
    // Wait a 5 seconds and re-load again.
    console.log(err);
    window.setTimeout(reloadWrapper, 5000);
    return;
  }
  const worker = new SharedWorker("worker.js");

  const camera = new Camera("camera_1");
  const scene = new World("mesh1", terrainGenerator, worker);
  const renderer = new Renderer("renderer1");

  renderer.setScene(scene);
  renderer.setCamera(camera);

  MainLoop.renderers.push(renderer);
  MainLoop.startRendering();

  const keyboard = new UIKeyboard();
  const mouse = new UIMouse();

  const fpsWidget = new StatusWidget();
  const cameraWidget = new CameraPositionWidget(camera);
  const menuWidget = new MenuWidget("world_tiles");
  const widgetContainer = document.createElement("div");
  widgetContainer.className = "widget-container";
  widgetContainer.appendChild(fpsWidget.element);
  widgetContainer.appendChild(cameraWidget.element);
  widgetContainer.appendChild(menuWidget.element);
  renderer.element.appendChild(widgetContainer);
}


window.onload = () => {
  init();
};

