// Copyright 2017 duncan law (mrdunk@gmail.com)

import {Controller, ILineEvent} from "./controller";

export abstract class ModelBase {
  private controller: Controller;
  public init(controller: Controller) {
    this.controller = controller;
  }

  public abstract onLineEvent(event): void;
}

export class Model extends ModelBase {
  private data = {
    ship: {},
  };

  public onLineEvent(event) {
    // TODO.
  }
}

export class ModelMock extends ModelBase {
  public lineEvents: [ILineEvent] = ([] as [ILineEvent]);

  public onLineEvent(event: ILineEvent) {
    this.lineEvents.push(event);
  }
}
