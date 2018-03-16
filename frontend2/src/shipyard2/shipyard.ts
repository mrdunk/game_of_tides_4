// Copyright 2017 duncan law (mrdunk@gmail.com)

import {Controller} from "./controller";
import {Model} from "./model";
import {ViewCanvas,
        ViewCrossSection,
        ViewLengthSection,
        ViewThree,
        ViewToolbar} from "./view";

window.onload = () => {
  console.log("shipyard.ts");
  const model = new Model();
  const toolbar = new ViewToolbar();
  const canvas = new ViewCanvas();
  const crossSection = new ViewCrossSection(canvas, 10, 10, 300, 300);
  const crossSection2 = new ViewCrossSection(canvas, 320, 10, 300, 300);
  const lengthSection = new ViewLengthSection(canvas, 10, 400, 1200, 300);
  crossSection.registerLengthSection(lengthSection);
  crossSection2.registerLengthSection(lengthSection);
  const threeD = new ViewThree(canvas, 630, 10, 600, 300);
  const controller = new Controller(
    model, [toolbar, crossSection, crossSection2, lengthSection, threeD]);

  window.addEventListener("resize", canvas.resize.bind(canvas));
};
