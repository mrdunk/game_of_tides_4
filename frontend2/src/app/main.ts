// Copyright 2017 duncan law (mrdunk@gmail.com)
const timeStep = 1000 / 60;
const maxFps = 60;

function init() {
  const terrainGenerator = new Module.DataSourceGenerate();

  const camera = new Camera("camera_1");
  const scene = new Scene();
  const renderer = new Renderer("renderer1", terrainGenerator);

  // const mesh1 = new Box("mesh1");
  const meshes = new World("mesh1", terrainGenerator);
  meshes.meshes.forEach((mesh) => {scene.setMesh(mesh);});

  renderer.setScene(scene);
  renderer.setCamera(camera);

  MainLoop.renderers.push(renderer);
  MainLoop.startRendering();

  const keyboard = new UIKeyboard();
  const mouse = new UIMouse();

  const fpsWidget = new StatusWidget();
  const cameraWidget = new CameraPositionWidget(camera);
  const widgetContainer = document.createElement("div");
  widgetContainer.className = "widget-container";
  widgetContainer.appendChild(fpsWidget.element);
  widgetContainer.appendChild(cameraWidget.element);
  renderer.element.appendChild(widgetContainer);
}


window.onload = () => {
  init();
};

