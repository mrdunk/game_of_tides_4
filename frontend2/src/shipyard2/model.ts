// Copyright 2017 duncan law (mrdunk@gmail.com)

import {compareLinePos,
  ControllerBase,
  IBackgroundImage,
  IBackgroundImageEvent,
  ILine,
  ILinePos,
  IPoint} from "./controller";
import {
  EventBase,
  EventLineDelete,
  EventLineHighlight,
  EventLineMirror,
  EventLineModify,
  EventLineSelect,
  LineEnd} from "./events";

export abstract class ModelBase {
  protected controller: ControllerBase;
  public init(controller: ControllerBase) {
    this.controller = controller;
  }

  public abstract onLineEvent(event: EventBase): void;
  public abstract onBackgroundImageEvent(event): void;
  public nearestLine(point: IPoint, ignoreLines): {point: IPoint,
                                                       mirrored: boolean} {
    return {point: null, mirrored: null};
  }
  public abstract getLine(lineId: string): ILine;
  public getSelectedLines(): {} {
    return null;
  }
  protected deSelectAll() { console.error("Undefined method"); }
}

export class Model extends ModelBase {
  private data = {
    lines: {},
    backgroundImages: {},
    selectedLines: {},
  };

  public onLineEvent(event: EventBase) {
    switch(event.constructor.name) {
      case "EventLineNew":
      case "EventLineModify":
        this.modifyLine(event as EventLineModify);
        break;
      case "EventLineSelect":
        this.selectLine(event as EventLineSelect);
        break;
      case "EventLineHighlight":
        this.highlightLine(event as EventLineHighlight);
        break;
      case "EventLineMirror":
        this.mirrorLine(event as EventLineMirror);
        break;
      case "EventLineDelete":
        this.deleteLine(event as EventLineDelete);
        break;
      default:
        console.error("Unknown event:", event);
    }
  }

  public onBackgroundImageEvent(event: IBackgroundImageEvent) {
    // console.log(event);
    if(!this.data.backgroundImages[event.widgetType]) {
      this.createBackgroundImage(event);
    }
    this.modifyBackgroundImage(event);
  }

  public nearestLine(point: IPoint, ignoreLines): {point: IPoint,
                                                       mirrored: boolean} {
    let nearestDist: number = 99999999;
    let nearest: IPoint;
    let mirrored = false;
    Object.getOwnPropertyNames(this.data.lines).forEach((lineName) => {
      const testLine = this.data.lines[lineName];
      if(ignoreLines.indexOf(lineName) < 0) {
        let dist =
          Math.abs(testLine.finishPos.a.x - point.x) +
          Math.abs(testLine.finishPos.a.y - point.y);
        if(dist < nearestDist && dist > 0) {
          nearestDist = dist;
          nearest = testLine.finishPos.a;
          mirrored = false;
        }
        dist =
          Math.abs(testLine.finishPos.b.x - point.x) +
          Math.abs(testLine.finishPos.b.y - point.y);
        if(dist < nearestDist && dist > 0) {
          nearestDist = dist;
          nearest = testLine.finishPos.b;
          mirrored = false;
        }
        if(testLine.mirrored) {
          dist =
            Math.abs(testLine.finishPos.a.x + point.x) +
            Math.abs(testLine.finishPos.a.y - point.y);
          if(dist < nearestDist && dist > 0) {
            nearestDist = dist;
            nearest = testLine.finishPos.a;
            mirrored = true;
          }
          dist =
            Math.abs(testLine.finishPos.b.x + point.x) +
            Math.abs(testLine.finishPos.b.y - point.y);
          if(dist < nearestDist && dist > 0) {
            nearestDist = dist;
            nearest = testLine.finishPos.b;
            mirrored = true;
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

  protected deSelectAll() {
    for(const lineId in this.data.selectedLines) {
      if(this.data.selectedLines.hasOwnProperty(lineId)) {
        const line = this.data.lines[lineId];
        if(line && line.selected) {
          line.selected = false;
          this.controller.updateViews(line);
        }
      }
    }
    this.data.selectedLines = {};
  }

  private createLine(event: EventLineModify) {
    const line: ILine = {
      id: event.lineId,
      finishPos: {a: JSON.parse(JSON.stringify(event.startPoint)),
                  b: {x: 0, y: 0, z: 0}},
    };
    this.data.lines[event.lineId] = line;
  }

  private createBackgroundImage(event: IBackgroundImageEvent) {
    const backgroundImage: IBackgroundImage = {widgetType: event.widgetType};
    this.data.backgroundImages[event.widgetType] = backgroundImage;
  }

  private modifyLine(event: EventLineModify) {
    console.log(event);
    console.assert(Boolean(event));
    console.assert(Boolean(event.finishPoint));
    console.assert(Boolean(event.lineId));
    console.assert(event.lineEnd !== undefined && event.lineEnd !== null);

    if(!this.data.lines[event.lineId]) {
      this.createLine(event);
    }
    const line: ILine = this.data.lines[event.lineId];
    console.assert(Boolean(line));

    this.deSelectAll();
    line.selected = true;
    this.data.selectedLines[line.id] = true;

    switch(event.lineEnd) {
      case LineEnd.A1:
        line.finishPos.a = JSON.parse(JSON.stringify(event.finishPoint));
        break;
      case LineEnd.A2:
        line.finishPos.a = JSON.parse(JSON.stringify(event.finishPoint));
        line.finishPos.a.x = -line.finishPos.a.x;
        break;
      case LineEnd.B1:
        line.finishPos.b = JSON.parse(JSON.stringify(event.finishPoint));
        break;
      case LineEnd.B2:
        line.finishPos.b = JSON.parse(JSON.stringify(event.finishPoint));
        line.finishPos.b.x = -line.finishPos.b.x;
        break;
      default:
        console.log("TODO Move whole line");
        return;
    }

    this.controller.updateViews(line);

    /*if(event.finishPoint) {
      this.deSelectAll();
      line.selected = true;
      this.data.selectedLines[line.id] = true;
      line.finishPos = JSON.parse(JSON.stringify(event.finishPoint));
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
      delete this.data.lines[event.lineId];
    }
    // console.log(line);*/
    console.log(this.data);
  }

  private deleteLine(event: EventLineDelete) {
    console.assert(Boolean(event));
    console.assert(Boolean(event.lineId));

    if(this.data.lines[event.lineId] !== undefined) {
      const line: ILine = this.data.lines[event.lineId];
      delete line.finishPos;
      this.controller.updateViews(line);

      delete this.data.lines[event.lineId];
    }
    if(this.data.selectedLines[event.lineId] !== undefined) {
      delete this.data.selectedLines[event.lineId];
    }
  }

  private selectLine(event: EventLineSelect) {
    console.assert(Boolean(event));
    console.assert(Boolean(event.lineId));

    const line: ILine = this.data.lines[event.lineId];
    console.assert(Boolean(line));

    line.selected = !line.selected;
    this.data.selectedLines[line.id] = line.selected;
    if(this.data.selectedLines[line.id] === false) {
      delete this.data.selectedLines[line.id];
    }
    this.controller.updateViews(line);
  }

  private highlightLine(event: EventLineHighlight) {
    console.assert(Boolean(event));

    // Un-highlight all lines.
    for(const key in this.data.lines) {
      if(this.data.lines.hasOwnProperty(key)) {
        if(this.data.lines[key].highlight) {
          this.data.lines[key].highlight = false;
          this.controller.updateViews(this.data.lines[key]);
        }
      }
    }

    const line: ILine = this.data.lines[event.lineId];
    if(!Boolean(line)) {
      return;
    }

    line.highlight = true;
    this.controller.updateViews(line);
  }

  private mirrorLine(event: EventLineMirror) {
    console.assert(Boolean(event));
    console.assert(Boolean(event.lineId));

    const line: ILine = this.data.lines[event.lineId];
    console.assert(Boolean(line));

    line.mirrored = !line.mirrored;
    this.controller.updateViews(line);
  }

  private modifyBackgroundImage(event: IBackgroundImageEvent) {
    const backgroundImage: IBackgroundImage =
      this.data.backgroundImages[event.widgetType];

    if(event.finishVisible && event.finishImage) {
      backgroundImage.finishVisible = true;
      backgroundImage.finishImage = event.finishImage;
      backgroundImage.finishPos = {x: 0, y: 0};
      if(event.finishPos) {
        backgroundImage.finishPos = JSON.parse(JSON.stringify(event.finishPos));
      }
    } else if(event.finishPos) {
      backgroundImage.finishPos.x =
        event.startPos.x + event.finishPos.x;
      backgroundImage.finishPos.y =
        event.startPos.y + event.finishPos.y;
    } else {
      backgroundImage.finishVisible = false;
    }

    this.controller.updateViewsBackgroundImage(backgroundImage);

    // console.log(event);
    // console.log(backgroundImage);
    // console.log(this.data);
  }
}

export class ModelMock extends ModelBase {
  public lineEvents: [EventBase] = ([] as [EventBase]);
  public mockGetLineValue: ILine = null;
  public mockNearestLine = {point: null, mirrored: null};
  public mockGetSelectedLines = {};

  public onLineEvent(event: EventBase) {
    this.lineEvents.push(event);
  }

  public onBackgroundImageEvent(event: EventBase) {
    //
  }

  public getLine(lineId: string): ILine {
    return this.mockGetLineValue;
  }

  public nearestLine(point: IPoint, ignoreLines): {point: IPoint,
                                                      mirrored: boolean} {
    return this.mockNearestLine;
  }

  public getSelectedLines(): {} {
    return this.mockGetSelectedLines;
  }
}
