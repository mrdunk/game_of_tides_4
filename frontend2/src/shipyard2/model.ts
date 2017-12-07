// Copyright 2017 duncan law (mrdunk@gmail.com)

import {compareLinePos,
  ControllerBase,
  ILine,
  ILineEvent,
  ILinePos,
  IPoint} from "./controller";

export abstract class ModelBase {
  protected controller: ControllerBase;
  public init(controller: ControllerBase) {
    this.controller = controller;
  }

  public abstract onLineEvent(event): void;
  public nearestLine(line: ILine): {point: IPoint, mirrored: boolean} {
    return {point: null, mirrored: null};
  }
  public abstract getLine(lineId: string): ILine;
  public deSelectAll() { /**/ }
  public getSelectedLines(): {} {
    return null;
  }

}

export class Model extends ModelBase {
  private data = {
    lines: {},
    selectedLines: {},
  };

  public onLineEvent(event: ILineEvent) {
    // console.log(event);
    if(!this.data.lines[event.id]) {
      this.createLine(event);
    }
    this.modifyLine(event);
  }

  public nearestLine(line: ILine): {point: IPoint, mirrored: boolean} {
    let nearestDist: number = 99999999;
    let nearest: IPoint;
    let mirrored = false;
    Object.getOwnPropertyNames(this.data.lines).forEach((lineName) => {
      const testLine = this.data.lines[lineName];
      if(line.id !== lineName) {
        if(testLine.finishPos.a.z === line.finishPos.a.z &&
            testLine.finishPos.b.z === line.finishPos.b.z) {
          let dist =
            Math.abs(testLine.finishPos.a.x - line.finishPos.a.x) +
            Math.abs(testLine.finishPos.a.y - line.finishPos.a.y);
          if(dist < nearestDist && dist > 0) {
            nearestDist = dist;
            nearest = testLine.finishPos.a;
          }
          dist =
            Math.abs(testLine.finishPos.b.x - line.finishPos.a.x) +
            Math.abs(testLine.finishPos.b.y - line.finishPos.a.y);
          if(dist < nearestDist && dist > 0) {
            nearestDist = dist;
            nearest = testLine.finishPos.b;
          }
          dist =
            Math.abs(testLine.finishPos.a.x - line.finishPos.b.x) +
            Math.abs(testLine.finishPos.a.y - line.finishPos.b.y);
          if(dist < nearestDist && dist > 0) {
            nearestDist = dist;
            nearest = testLine.finishPos.a;
          }
          dist =
            Math.abs(testLine.finishPos.b.x - line.finishPos.b.x) +
            Math.abs(testLine.finishPos.b.y - line.finishPos.b.y);
          if(dist < nearestDist && dist > 0) {
            nearestDist = dist;
            nearest = testLine.finishPos.b;
          }

          if(testLine.mirrored || line.mirrored) {
            dist =
              Math.abs(testLine.finishPos.a.x + line.finishPos.a.x) +
              Math.abs(testLine.finishPos.a.y - line.finishPos.a.y);
            if(dist < nearestDist && dist > 0) {
              nearestDist = dist;
              nearest = testLine.finishPos.a;
              mirrored = true;
            }
            dist =
              Math.abs(testLine.finishPos.b.x + line.finishPos.a.x) +
              Math.abs(testLine.finishPos.b.y - line.finishPos.a.y);
            if(dist < nearestDist && dist > 0) {
              nearestDist = dist;
              nearest = testLine.finishPos.b;
              mirrored = true;
            }
            dist =
              Math.abs(testLine.finishPos.a.x + line.finishPos.b.x) +
              Math.abs(testLine.finishPos.a.y - line.finishPos.b.y);
            if(dist < nearestDist && dist > 0) {
              nearestDist = dist;
              nearest = testLine.finishPos.a;
              mirrored = true;
            }
            dist =
              Math.abs(testLine.finishPos.b.x + line.finishPos.b.x) +
              Math.abs(testLine.finishPos.b.y - line.finishPos.b.y);
            if(dist < nearestDist && dist > 0) {
              nearestDist = dist;
              nearest = testLine.finishPos.b;
              mirrored = true;
            }
          }
        }
      }
    });
    return {point: nearest, mirrored};
  }

  public getLine(lineId: string): ILine {
    return this.data.lines[lineId];
  }

  public getSelectedLines(): {} {
    return this.data.selectedLines;
  }

  public deSelectAll() {
    for(const lineId in this.data.selectedLines) {
      if(this.data.selectedLines.hasOwnProperty(lineId)) {
        const line = this.data.lines[lineId];
        if(line) {
          line.selected = false;
          this.controller.updateViews(line);
        }
      }
    }
    this.data.selectedLines = {};
  }

  private createLine(event: ILineEvent) {
    const line: ILine = {id: event.id};
    this.data.lines[event.id] = line;
  }

  private modifyLine(event: ILineEvent) {
    const line = this.data.lines[event.id];
    // console.log(event);

    if(event.finishPos) {
      this.deSelectAll();
      line.selected = true;
      this.data.selectedLines[line.id] = true;
      line.finishPos = JSON.parse(JSON.stringify(event.finishPos));
    } else if(event.highlight === undefined &&
              event.toggleMirrored === undefined &&
              event.selecting === undefined) {
      delete line.finishPos;
    }

    if(event.highlight !== undefined) {
      line.highlight = event.highlight;
    }

    if(event.toggleMirrored !== undefined) {
      line.mirrored = !line.mirrored;
    }

    if(event.mirrored !== undefined) {
      line.mirrored = event.mirrored;
    }

    if(event.selecting !== undefined) {
      line.selected = !line.selected;
      if(event.selected) {
        line.selected = event.selected;
      }
      if(line.selected) {
        this.data.selectedLines[line.id] = true;
      } else {
        delete this.data.selectedLines[line.id];
      }
      console.log(this.data.selectedLines);
    }

    this.controller.updateViews(line);

    if(!event.finishPos &&
        event.highlight === undefined &&
        event.toggleMirrored === undefined &&
        event.selecting === undefined) {
      delete this.data.lines[event.id];
    }
    // console.log(line);
    // console.log(this.data);
  }
}

export class ModelMock extends ModelBase {
  public lineEvents: [ILineEvent] = ([] as [ILineEvent]);
  public mockGetLineValue: ILine = null;
  public mockNearestLine = {point: null, mirrored: null};

  public onLineEvent(event: ILineEvent) {
    this.lineEvents.push(event);
  }

  public getLine(lineId: string): ILine {
    return this.mockGetLineValue;
  }

  public nearestLine(line: ILine): {point: IPoint, mirrored: boolean} {
    return this.mockNearestLine;
  }
}
