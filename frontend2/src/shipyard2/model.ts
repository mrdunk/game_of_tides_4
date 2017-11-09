// Copyright 2017 duncan law (mrdunk@gmail.com)

import {Controller, ILine, ILineEvent} from "./controller";

export abstract class ModelBase {
  protected controller: Controller;
  public init(controller: Controller) {
    this.controller = controller;
  }

  public abstract onLineEvent(event): void;
}

export class Model extends ModelBase {
  private data = {
    lines: {},
  };
  private sequences = {};  // TODO Type.
  private idNumber: number = 0;

  public onLineEvent(event: ILineEvent) {
    if(!event.id) {
      this.createLine(event);
      return;
    }
    this.modifyLine(event);
  }

  private createLine(event: ILineEvent) {
    console.log("createLine(", event, ")");

    let id = this.sequences[event.sequence];
    if(id === undefined) {
      id = "line_" + this.idNumber;
      this.idNumber++;
      this.sequences[event.sequence] = id;
      const line: ILine = {id};
      this.data.lines[id] = line;
    }
    event.id = id;
    this.modifyLine(event);
  }

  private modifyLine(event: ILineEvent) {
    console.log(event);
    console.log(this.data);

    const line = this.data.lines[event.id];
    if(event.finishPos) {
      line.finishPos = JSON.parse(JSON.stringify(event.finishPos));
    }

    this.controller.updateViews(line);
  }
}

export class ModelMock extends ModelBase {
  public lineEvents: [ILineEvent] = ([] as [ILineEvent]);

  public onLineEvent(event: ILineEvent) {
    this.lineEvents.push(event);
  }
}
