// Copyright 2017 duncan law (mrdunk@gmail.com)

import {Controller} from "./controller";
import {Model} from "./model";
import {ViewToolbar} from "./view";

window.onload = () => {
  const model = new Model();
  const toolbar = new ViewToolbar();
  const controller = new Controller(model, [toolbar]);
  console.log("shipyard.ts");
};
