// Copyright 2017 duncan law (mrdunk@gmail.com)

import {Controller} from "./controller";
import {Model} from "./model";
import {ViewCanvas, ViewCrossSection, ViewToolbar} from "./view";

window.onload = () => {
  console.log("shipyard.ts");
  const model = new Model();
  const toolbar = new ViewToolbar();
  const canvas = new ViewCanvas();
  const crossSection = new ViewCrossSection(canvas, 10, 10);
  const controller = new Controller(model, [toolbar, crossSection]);
};
