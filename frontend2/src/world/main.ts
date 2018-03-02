// Copyright 2017 duncan law (mrdunk@gmail.com)

import {Camera, Renderer, Scene} from "./3d";
import {BrowserInfo} from "./browser_info";
import {Globals} from "./globals";
import {MainLoop} from "./main_loop";
import {UIKeyboard, UIMaster, UIMenu, UIMixin, UIMouse} from "./user_input";
import {
  BrowserInfoWidget,
  CameraPositionWidget,
  CursorPositionWidget,
  MenuWidget,
  StatusWidget,
} from "./widgets";

declare function SharedWorker(url: string): void;

declare global {
  // tslint:disable-next-line:interface-name no-namespace
  interface Window {
    Worker: any;
    SharedWorker: any;
  }
}

function workerInit() {
  let worker;
  console.log("workerInit()");
  if(window.SharedWorker !== undefined) {
    console.log("Spawining SharedWorker");
    Globals.workerType = "SharedWorker";
    worker = new SharedWorker("worker.js");
    worker.port.start();
  } else if(window.Worker !== undefined) {
    console.log("Spawining Worker");
    Globals.workerType = "Worker";
    worker = new Worker("worker.js");
  } else {
    throw(new Error("Your browser does not support Workers"));
  }

  worker.onerror = (err) => {
    console.log(err.message);
    worker.port.close();
  };

  const w = worker.port || worker;
  w.postMessage(["ping"]);  // Bring up webworker.
  setInterval(() => {w.postMessage(["ping"]);}, 1000);

  return w;
}

function init() {
  const worker = workerInit();

  const uiMixin = new UIMixin();
  const keyboard = new UIKeyboard();
  const mouse = new UIMouse();

  const camera = new Camera("camera_1", worker, uiMixin);
  const scene = new Scene("mesh1", worker);
  const renderer = new Renderer("renderer1", UIMaster);

  renderer.setScene(scene);
  renderer.setCamera(camera);

  MainLoop.renderers.push(renderer);
  MainLoop.startRendering();

  const browserInfo = new BrowserInfo();

  const menuWidget = new MenuWidget(UIMaster, new UIMenu(), scene);
  const fpsWidget = new StatusWidget(scene);
  const cameraWidget = new CameraPositionWidget(camera);
  const cursorWidget = new CursorPositionWidget(scene);
  const browserInfoWidget = new BrowserInfoWidget(browserInfo);
  const widgetContainer = document.createElement("div");
  widgetContainer.className = "widget-container";
  widgetContainer.appendChild(menuWidget.element);
  widgetContainer.appendChild(fpsWidget.element);
  widgetContainer.appendChild(cameraWidget.element);
  widgetContainer.appendChild(cursorWidget.element);
  widgetContainer.appendChild(browserInfoWidget.element);
  renderer.element.appendChild(widgetContainer);
}


window.onload = () => {
  init();
};

