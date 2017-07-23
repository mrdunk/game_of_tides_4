const timeStep = 1000 / 60;
const maxFps = 60;

function init() {
  const camera = new Camera("camera_1");
  const scene = new Scene();
  const renderer = new Renderer("renderer1");

  const mesh1 = new Box("mesh1");
  scene.setMesh(mesh1);

  renderer.setScene(scene);
  renderer.setCamera(camera);

  MainLoop.renderers.push(renderer);
  MainLoop.startRendering();

  const keyboard = new UIKeyboard();

  const fpsWidget = new StatusWidget();
  const latLonWidget = new LatLonWidget(camera);
  const widgetContainer = document.createElement("div");
  widgetContainer.className = "widget-container";
  widgetContainer.appendChild(fpsWidget.element);
  widgetContainer.appendChild(latLonWidget.element);
  renderer.element.appendChild(widgetContainer);
}


window.onload = () => {
  init();
};

