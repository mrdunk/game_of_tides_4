// Copyright 2017 duncan law (mrdunk@gmail.com)

import {Controller} from "./controller";

export class Model {
  private controller: Controller;
  private data = {
    ship: {},
  };

  public init(controller: Controller) {
    this.controller = controller;
  }
}
