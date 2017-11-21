// Copyright 2017 duncan law (mrdunk@gmail.com)

import {ControllerBase, ILine, ILineEvent} from "./controller";

export abstract class ModelBase {
  protected controller: ControllerBase;
  public init(controller: ControllerBase) {
    this.controller = controller;
  }

  public abstract onLineEvent(event): void;
}

export class Model extends ModelBase {
  private data = {
    lines: {},
  };

  public onLineEvent(event: ILineEvent) {
    if(!this.data.lines[event.id]) {
      this.createLine(event);
    }
    this.modifyLine(event);
  }

  private createLine(event: ILineEvent) {
    const line: ILine = {id: event.id};
    this.data.lines[event.id] = line;
  }

  private modifyLine(event: ILineEvent) {
    const line = this.data.lines[event.id];

    if(event.finishPos) {
      line.finishPos = JSON.parse(JSON.stringify(event.finishPos));
    } else if(event.highlight === undefined &&
              event.toggleMirrored === undefined) {
      delete line.finishPos;
    }

    if(event.highlight !== undefined) {
      line.highlight = event.highlight;
    }

    if(event.toggleMirrored !== undefined) {
      line.mirrored = !line.mirrored;
    }

    this.controller.updateViews(line);

    if(!event.finishPos &&
        event.highlight === undefined &&
        event.toggleMirrored === undefined) {
      delete this.data.lines[event.id];
    }
    // console.log(this.data);
  }
}

export class ModelMock extends ModelBase {
  public lineEvents: [ILineEvent] = ([] as [ILineEvent]);

  public onLineEvent(event: ILineEvent) {
    this.lineEvents.push(event);
  }
}
