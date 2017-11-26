// Copyright 2017 duncan law (mrdunk@gmail.com)

import {Controller} from "./controller";
import {Model} from "./model";
import {ViewCanvas,
        ViewCrossSection,
        ViewLengthSection,
        ViewToolbar} from "./view";

window.onload = () => {
  console.log("shipyard.ts");
  const model = new Model();
  const toolbar = new ViewToolbar();
  const canvas = new ViewCanvas();
  const crossSection = new ViewCrossSection(canvas, 10, 10, 400, 400);
  const lengthSection = new ViewLengthSection(canvas, 10, 500, 1200, 400);
  crossSection.registerLengthSection(lengthSection);
  const controller = new Controller(model,
                                    [toolbar, crossSection, lengthSection]);

  window.addEventListener("resize", canvas.resize.bind(canvas));
};
