// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import * as THREE from "three";
import {
  ControllerBase,
  IBackgroundImage,
  IBackgroundImageEvent,
  ICommand,
  ILine,
  ILinePos,
  IPoint,
  Ixy,
  MockController,
  subtractPoint} from "./controller";
import {
  EventBase,
  EventLineHighlight,
  EventUiInputElement,
  EventUiMouseDrag,
  EventUiMouseMove,
  EventUiSelectRib,
  LineEnd } from "./events";
import {
  DropDown,
  Modal} from "./modal";

interface IHash {
  [key: string]: any;
}

export class ViewBase {
  protected static widgetIdConter: number = 0;
  public widgetType: string = "base";
  protected controller: ControllerBase;
  protected sequence: string = "";
  private sequenceCounter: number = 0;
  private widgetId: number;

  constructor() {
    this.widgetId = ViewBase.widgetIdConter++;
  }

  public syncSequence(lineId: string) {
    console.assert(Boolean(lineId));

    let lineType;
    let parsedWidget;
    let parsedSequence;
    [lineType, parsedWidget, parsedSequence] = lineId.split("_");

    if(lineType !== "drawnLine") {
      return;
    }
    if(parseInt(parsedWidget, 10) !== this.widgetId) {
      return;
    }
    if(parseInt(parsedSequence, 10) >= this.sequenceCounter) {
      this.sequenceCounter = parseInt(parsedSequence, 10);
    }
    // console.log([lineType, parsedWidget, parsedSequence]);
  }

  public init(controller: ControllerBase) {
    this.controller = controller;
  }

  public setButtonValue(buttonLabel: string, value: number) {
    console.error("Undefined method");
  }

  public setButtonState(buttonLabel: string, state: boolean) {
    // console.error("Undefined method");
  }

  public updateLine(lineEvent: ILine) {
    // console.error("Undefined method");
  }

  public drawSelectCursor(a?: IPoint, b?: IPoint) {
    console.error("Undefined method");
  }

  public setBackgroundImage(backgroundImage: IBackgroundImage) {
    console.error("Undefined method");
  }

  // Generate a unique id for a series of related events.
  protected newSequence(): string {
    this.sequenceCounter++;
    this.sequence =
      "sequence_" + this.widgetId + "_" + this.sequenceCounter;
    return this.sequence;
  }

}

export class ViewCanvas {
  public stage: Konva.Stage;
  public layer: Konva.Layer;

  constructor() {
    this.stage = new Konva.Stage({
      container: "canvas",   // id of container <div>
      scaleX: 1,
      scaleY: 1,
      width: 500,  // TODO: Dynamic sizing
      height: 500,
    });
    this.layer = new Konva.Layer();

    this.stage.add(this.layer);

    this.resize();
  }

  public resize() {
    const container = document.querySelector("#canvas") as HTMLCanvasElement;
    this.stage.width(container.offsetWidth);
    this.stage.height(container.offsetHeight);
    this.stage.scale({x: 1.0, y: 1.0});
  }
}

export abstract class ViewSection extends ViewBase {
  public fixedAxis: string;
  public fixedDragAxis: string;
  public offsetX: number;
  public offsetY: number;
  public width: number;
  public height: number;
  protected layer: Konva.Layer;
  protected lines: IHash = {};
  protected mouseDown: boolean = false;
  protected mouseDragStartPos: IPoint;
  protected mouseDragStartLineId: string;
  protected mouseDragStartEndId: LineEnd;
  protected background: Konva.Group;
  protected geometry: Konva.Group;
  protected canvas: ViewCanvas;
  protected selectCursor: Konva.Rect;
  protected backgroundImage: Konva.Image;
  protected backgroundImageFilename: string;
  protected backgroundImagePos: {sequence: string, pos: Ixy};
  protected selectedLines: string[] = [];

  constructor(canvas: ViewCanvas,
              x?: number,
              y?: number,
              width?: number,
              height?: number) {
    super();

    x = x || 0;
    y = y || 0;
    this.offsetX = x;
    this.offsetY = y;
    this.width = width || 400;
    this.height = height || 400;
    this.canvas = canvas;
    this.layer = canvas.layer;

    this.background = new Konva.Group({
      x,
      y,
      width: this.width,
      height: this.height,
      draggable: false,
    });
    this.background.clip({x: 0, y: 0, width: this.width, height: this.height});
    canvas.layer.add(this.background);

    this.geometry = new Konva.Group({
      x,
      y,
      width: this.width,
      height: this.height,
      draggable: false,
    });
    canvas.layer.add(this.geometry);

    const sky = new Konva.Rect({
      width: this.background.width(),
      height: this.background.height() / 2,
      fill: "#C4E0E5",
      stroke: "grey",
      strokeWidth: 1,
    });

    const sea = new Konva.Rect({
      y: this.background.height() / 2,
      width: this.background.width(),
      height: this.background.height() / 2,
      fill: "#88C0CA",
      stroke: "grey",
      strokeWidth: 1,
    });

    this.background.on("mousemove", this.onMouseMove.bind(this));

    this.background.add(sky);
    this.background.add(sea);

    this.selectCursor = new Konva.Rect({
      visible: false,
      stroke: "orange",
      strokeWidth: 2,
    });
    this.selectCursor.on("mousemove", this.onMouseMove.bind(this));

    this.layer.add(this.selectCursor);
    this.layer.draw();

    this.backgroundImagePos = {sequence: "", pos: {x:0, y:0}};
  }

  public setBackgroundImage(backgroundImage: IBackgroundImage) {
    if(backgroundImage.widgetType !== this.widgetType) {
      return;
    }

    const filename = backgroundImage.finishImage;
    let visible = backgroundImage.finishVisible;
    if(this.backgroundImageFilename !== filename) {
      console.log("initialising", filename);
      const image = new Image();
      image.onload = () => {
        if(this.backgroundImage) {
          this.backgroundImage.destroy();
        }
        this.backgroundImage = new Konva.Image({
          x: backgroundImage.finishPos.x,
          y: backgroundImage.finishPos.y,
          image,
          scaleX: 1,
          scaleY: 1,
          opacity: 0.5,
          visible: true,
        });

        this.background.add(this.backgroundImage);
        this.background.draw();
        this.geometry.draw();
      };
      this.backgroundImageFilename = filename;
      image.src = filename;
    }

    if(this.backgroundImage) {
      if(!this.backgroundImageFilename) {
        visible = false;
      }
      this.backgroundImage.visible(visible);
      if(backgroundImage.finishPos) {
        this.backgroundImage.x(backgroundImage.finishPos.x);
        this.backgroundImage.y(backgroundImage.finishPos.y);
      }
      this.background.draw();
      this.geometry.draw();
    }
  }

  public unhighlightAll() {
    Object.getOwnPropertyNames(this.lines).forEach((lineName) => {
      const line = this.lines[lineName];
      line.highlight(false);
    });
  }

  protected updateBackgroundImage(visible: boolean, url: string) {
    if(visible === null || visible === undefined) {
      if(this.backgroundImage) {
        visible = this.backgroundImage.visible();
      }
    }
    if(url === null || url === undefined) {
      url = this.backgroundImageFilename;
    } else {
      visible = true;
    }
    this.newSequence();
    const event: IBackgroundImageEvent = {
      sequence: this.sequence,
      widgetType: this.widgetType,
      startVisible: !visible,
      finishVisible: visible,
      startImage: this.backgroundImageFilename,
      finishImage: url,
    };

    this.controller.onBackgroundImageEvent(event);
  }

  // TODO Private?
  protected getLineOver(event) {
    const shape = event.target;
    const parent: Line = shape.getParent();
    let lineId;
    let endId;
    if(parent instanceof Line) {
      lineId = parent.id();
      if(shape.id() === "end1A") {
        endId = LineEnd.A1;
      } else if(shape.id() === "end2A") {
        endId = LineEnd.A2;
      } else if(shape.id() === "end1B") {
        endId = LineEnd.B1;
      } else if(shape.id() === "end2B") {
        endId = LineEnd.B2;
      }
    }
    return [lineId, endId];
  }

  protected onMouseMove(event) {
    const mouseDown = event.evt.buttons === 1;

    const [lineId, lineEnd] = this.getLineOver(event);

    if(mouseDown) {
      const hintLine =
        this.controller.getLine(this.mouseDragStartLineId || lineId);
      let hintPoint: IPoint;
      if(hintLine) {
        // Line already exists.
        const end = LineEnd[this.mouseDragStartEndId || lineEnd];
        if(end) {
          hintPoint = hintLine.finishPos[end.toLowerCase()[0]];
        }
      } else {
        // New line.
        hintPoint = this.mouseDragStartPos || this.getMousePosIn3d();
      }

      if(!this.mouseDown) {
        // Mouse button not pressed last cycle. This is a new Drag event.
        this.newSequence();
        this.mouseDragStartPos = this.getMousePosIn3d(hintPoint);
        this.mouseDragStartLineId = lineId;
        this.mouseDragStartEndId = lineEnd;
      }

      const dragEvent = new EventUiMouseDrag({
        widgetType: this.widgetType,
        sequence: this.sequence,
        startPoint: this.mouseDragStartPos,
        finishPoint: this.getMousePosIn3d(hintPoint),
        lineId: this.mouseDragStartLineId,
        lineEnd: this.mouseDragStartEndId,
      });
      if(this.fixedDragAxis && hintPoint) {
        dragEvent.finishPoint[this.fixedDragAxis] =
          hintPoint[this.fixedDragAxis];
      }
      this.controller.onEvent(dragEvent);
    } else {
      const dragEvent = new EventUiMouseMove({
        widgetType: this.widgetType,
        startPoint: this.getMousePosIn3d(),
        lineId,
        lineEnd,
      });
      this.controller.onEvent(dragEvent);

      this.mouseDragStartPos = undefined;
      this.mouseDragStartLineId = undefined;
      this.mouseDragStartEndId = undefined;
    }
    this.mouseDown = mouseDown;
  }

  protected getPointerPosition(): {x: number, y: number} {
    const screenMousePos = this.layer.getStage().getPointerPosition();
    const scale = this.canvas.stage.scale();
    return this.translateScreenToWidget(
      {x: screenMousePos.x / scale.x, y: screenMousePos.y / scale.y});
  }

  protected translateWidgetToScreen(pos: {x: number, y: number}) {
    const x = Math.round(
      pos.x + (this.background.getWidth() /2));
    const y = Math.round(
      -pos.y + (this.background.getHeight() /2));
    return {x, y};
  }

  protected translateScreenToWidget(
        pos: {x: number, y: number}): {x: number, y: number} {
    return this.limitBounds(this.translateWidget(
      {x: pos.x - this.background.x(), y: pos.y - this.background.y()}));
  }

  protected translateWidget(
        pos: {x: number, y: number}): {x: number, y: number} {
    const x = Math.round(
      pos.x - (this.background.getWidth() /2));
    const y = Math.round(
      -pos.y + (this.background.getHeight() /2));

    return {x, y};
  }

  protected limitBounds(pos: {x: number, y: number}): {x: number, y: number} {
    if(pos.x > this.width / 2) {
      pos.x = this.width / 2;
    }
    if(pos.x < -this.width / 2) {
      pos.x = -this.width / 2;
    }
    if(pos.y > this.height / 2) {
      pos.y = this.height / 2;
    }
    if(pos.y < -this.height / 2) {
      pos.y = -this.height / 2;
    }
    return pos;
  }

  protected abstract getMousePosIn3d(hint?: IPoint): IPoint;
}

export class ViewCrossSection extends ViewSection {
  public z: number = 0;
  public widgetType: string = "cross";
  private showLayersValue: boolean = false;
  private lengthSection: ViewSection;
  private lengthCursorL: Konva.Line;
  private lengthCursorR: Konva.Line;

  constructor(canvas: ViewCanvas,
              x?: number,
              y?: number,
              width?: number,
              height?: number) {
    super(canvas, x, y, width, height);

    const midline = new Konva.Line({
      points: [
        this.background.width() / 2,
        0,
        this.background.width() / 2,
        this.background.height() ],
      stroke: "grey",
    });

    this.background.add(midline);
    this.fixedAxis = "z";
  }

  public registerLengthSection(section: ViewSection) {
    this.lengthSection = section;
    this.lengthCursorL = new Konva.Line(
      { points: [0, 0, 1000, 1000],
        stroke: "yellow",
        strokeWidth: 5,
        opacity: 0.7,
        lineCap: "round",
      });
    this.lengthCursorR = new Konva.Line(
      { points: [1000, 0, 1000, 1000],
        stroke: "yellow",
        strokeWidth: 5,
        opacity: 0.7,
        lineCap: "round",
      });
    this.layer.add(this.lengthCursorL);
    this.layer.add(this.lengthCursorR);
    this.lengthCursorL.moveToBottom();
    this.lengthCursorR.moveToBottom();
    this.updateLengthCursor();
  }

  public updateLine(lineEvent: ILine) {
    console.assert(Boolean(lineEvent.id));
    let line = this.lines[lineEvent.id];

    if(!Boolean(lineEvent.finishPos)) {
      console.log("Delete", line);
      if(line) {
        line.destroy();
        delete this.lines[lineEvent.id];
        this.layer.draw();
      }
      return;
    }

    if(line === undefined) {
      line = new Line(lineEvent.id, this.onMouseMove.bind(this));
      this.lines[lineEvent.id] = line;
      this.geometry.add(line);
    }

    if(lineEvent.finishPos) {
      const a1 = this.translateWidgetToScreen(lineEvent.finishPos.a);
      const b1 = this.translateWidgetToScreen(lineEvent.finishPos.b);

      // Reverse x coordinate for mirror line.
      const finishPosA2 = JSON.parse(JSON.stringify(lineEvent.finishPos.a));
      finishPosA2.x = -finishPosA2.x;
      const finishPosB2 = JSON.parse(JSON.stringify(lineEvent.finishPos.b));
      finishPosB2.x = -finishPosB2.x;
      const a2 = this.translateWidgetToScreen(finishPosA2);
      const b2 = this.translateWidgetToScreen(finishPosB2);

      line.moveEnd(LineEnd.A1, a1.x, a1.y);
      line.moveEnd(LineEnd.B1, b1.x, b1.y);
      line.moveEnd(LineEnd.A2, a2.x, a2.y);
      line.moveEnd(LineEnd.B2, b2.x, b2.y);
      line.z = lineEvent.finishPos.a.z;
    }

    if(lineEvent.highlight !== undefined) {
      line.highlight(lineEvent.highlight);
    }
    if(lineEvent.selected !== undefined) {
      line.selected(lineEvent.selected);
    }
    if(lineEvent.mirrored !== undefined) {
      line.mirrored = lineEvent.mirrored;
      line.draw();
    }

    this.layer.draw();
  }

  public setButtonValue(buttonLabel: string, value: any) {
    // console.log(buttonLabel, value);
    switch (buttonLabel) {
      case "allLayers":
        // console.log(buttonLabel, value);
        this.showLayers(Boolean(value));
        break;
      case "selected_rib":
        // console.log(buttonLabel, value);
        this.z = value;
        this.showLayers();
        this.updateLengthCursor();
        break;
      case "backgroundImageShowCross":
        this.updateBackgroundImage(Boolean(value), null);
        break;
      case "backgroundImageUrlCross":
        this.updateBackgroundImage(null, value);
        break;
    }
  }

  // TODO Refactor into Base class.
  public drawSelectCursor(a?: IPoint, b?: IPoint) {
    if(a && b) {
      const aa = this.translateWidgetToScreen({x: a.x, y: a.y});
      const bb = this.translateWidgetToScreen({x: b.x, y: b.y});
      aa.x = aa.x + this.offsetX;
      aa.y = aa.y + this.offsetY;
      bb.x = bb.x + this.offsetX;
      bb.y = bb.y + this.offsetY;
      this.selectCursor.x(aa.x);
      this.selectCursor.y(aa.y);
      this.selectCursor.width(bb.x - aa.x);
      this.selectCursor.height(bb.y - aa.y);
      this.selectCursor.visible(true);
      this.layer.draw();

      this.selectedLines = [];
      Object.keys(this.lines).forEach((lineKey) => {
        const line = this.lines[lineKey];
        if(line.z === this.z) {
          if(line.doesOverlap(this.selectCursor)) {
            this.selectedLines.push(lineKey);
          }
        }
      });
      this.newSequence();
      this.controller.highlightLines(
        this.sequence, this.widgetType, this.selectedLines);
      return;
    }

    this.selectedLines.forEach((lineId) => {
      this.controller.toggleLineSelect(this.widgetType, lineId);
    });
    this.selectedLines = [];

    this.selectCursor.visible(false);
    this.layer.draw();
  }

  protected getMousePosIn3d(hint?: IPoint): IPoint {
    const mousePos = this.getPointerPosition();
    return {x: mousePos.x, y: mousePos.y, z: this.z};
  }

  private showLayers(value?: boolean) {
    if(value === undefined) {
      value = this.showLayersValue;
    }
    this.showLayersValue = value;

    Object.getOwnPropertyNames(this.lines).forEach((lineName) => {
      const line = this.lines[lineName];
      if(value) {
        line.visible(true);
      } else if(line.z === this.z) {
        line.visible(true);
      } else {
        line.visible(false);
      }
    });
    this.layer.draw();
  }

  private updateLengthCursor() {
    if(!this.lengthSection) {
      return;
    }

    const x1 = this.offsetX;
    const y1 = this.offsetY + this.height;
    const x2 =
      this.lengthSection.offsetX + (this.lengthSection.width / 2) + this.z;
    const y2 = this.lengthSection.offsetY;
    this.lengthCursorL.points([x1, y1, x2, y2]);
    this.lengthCursorR.points([x1 + this.width, y1, x2, y2]);
    this.layer.draw();
  }
}

export class ViewLengthSection extends ViewSection {
  public readonly x: number = 0;
  public cursorPos: number = 0;
  public widgetType: string = "length";
  private cursorHover: Konva.Rect;
  private cursor: Konva.Rect;
  private cursorWidth: number = 20;
  private zResolution: number = 20;

  constructor(canvas: ViewCanvas,
              x?: number,
              y?: number,
              width?: number,
              height?: number) {
    super(canvas, x, y, width, height);

    this.cursorHover = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.cursorWidth,
      height: this.height,
      fill: "white",
      opacity: 0.5,
      visible: false,
    });

    this.cursor = new Konva.Rect({
      x: this.cursorPos + (this.width / 2) - (this.cursorWidth / 2),
      y: 0,
      width: this.cursorWidth,
      height: this.height,
      fill: "yellow",
      opacity: 0.5,
      visible: true,
    });

    this.background.add(this.cursorHover);
    this.background.add(this.cursor);
    this.background.draw();

    this.background.on("mousedown", this.setCursor.bind(this));
    this.background.on("mousemove", this.moveCursor.bind(this));
    this.background.on("mouseleave", this.hideCursor.bind(this));

    this.fixedAxis = "x";
    this.fixedDragAxis = "z";
  }

  public updateLine(lineEvent: ILine) {
    console.assert(Boolean(lineEvent.id));
    let line = this.lines[lineEvent.id];

    if(!Boolean(lineEvent.finishPos)) {
      console.log("Delete", line);
      if(line) {
        line.destroy();
        delete this.lines[lineEvent.id];
        this.layer.draw();
      }
      return;
    }

    if(line === undefined) {
      line = new Line(lineEvent.id, this.onMouseMove.bind(this));
      this.lines[lineEvent.id] = line;
      this.geometry.add(line);
    }

    if(lineEvent.finishPos) {
      const aIn3d = {x: lineEvent.finishPos.a.z, y: lineEvent.finishPos.a.y};
      const bIn3d = {x: lineEvent.finishPos.b.z, y: lineEvent.finishPos.b.y};

      const a1 = this.translateWidgetToScreen(aIn3d);
      const b1 = this.translateWidgetToScreen(bIn3d);

      line.moveEnd(LineEnd.A1, a1.x, a1.y);
      line.moveEnd(LineEnd.B1, b1.x, b1.y);
      line.z = lineEvent.finishPos.a.z;
    }

    if(lineEvent.highlight !== undefined) {
      line.highlight(lineEvent.highlight);
    }
    if(lineEvent.selected !== undefined) {
      line.selected(lineEvent.selected);
    }

    this.layer.draw();
  }

  public setButtonValue(buttonLabel: string, value: number) {
    // console.log(buttonLabel, value);
    switch (buttonLabel) {
      case "backgroundImageShowLength":
        this.updateBackgroundImage(Boolean(value), null);
        break;
      case "backgroundImageUrlLength":
        this.updateBackgroundImage(null, "" + value);
        break;
    }
  }

  // TODO Refactor into Base class.
  public drawSelectCursor(a?: IPoint, b?: IPoint) {
    if(a && b) {
      const aa = this.translateWidgetToScreen({x: this.cursorPos - 10, y: a.y});
      const bb = this.translateWidgetToScreen({x: this.cursorPos + 10, y: b.y});
      aa.x = aa.x + this.offsetX;
      aa.y = aa.y + this.offsetY;
      bb.x = bb.x + this.offsetX;
      bb.y = bb.y + this.offsetY;
      this.selectCursor.x(aa.x);
      this.selectCursor.y(aa.y);
      this.selectCursor.width(bb.x - aa.x);
      this.selectCursor.height(bb.y - aa.y);
      this.selectCursor.visible(true);
      this.layer.draw();

      this.selectedLines = [];
      Object.keys(this.lines).forEach((lineKey) => {
        const line = this.lines[lineKey];
        if(line.z === this.cursorPos) {
          if(line.doesOverlap(this.selectCursor)) {
            this.selectedLines.push(lineKey);
          }
        }
      });
      this.newSequence();
      this.controller.highlightLines(
        this.sequence, this.widgetType, this.selectedLines);
      return;
    }

    this.selectedLines.forEach((lineId) => {
      this.controller.toggleLineSelect(this.widgetType, lineId);
    });
    this.selectedLines = [];

    this.selectCursor.visible(false);
    this.layer.draw();
  }

  protected getMousePosIn3d(hint?: IPoint): IPoint {
    let x = 0;
    if(hint) {
      x = hint.x;
    }
    const mousePos = this.getPointerPosition();
    mousePos.x = Math.round(mousePos.x / this.zResolution) * this.zResolution;
    return {x, y: mousePos.y, z: mousePos.x};
  }

  private setCursor(event) {
    const mousePos = this.getPointerPosition();
    mousePos.x = Math.round(mousePos.x / this.zResolution) * this.zResolution;

    if(mousePos.x >= (-this.width / 2) && mousePos.x <= (this.width / 2)) {
      this.cursorPos = mousePos.x;
      this.cursor.x(mousePos.x + (this.width / 2) - (this.cursorWidth / 2));
      this.cursor.visible(true);
      this.canvas.layer.draw();

      const dragEvent = new EventUiSelectRib({
        widgetType: this.widgetType,
        z: this.cursorPos,
      });
      this.controller.onEvent(dragEvent);
    }
  }

  private moveCursor(event) {
    const mouseDown = event.evt.buttons === 1;
    if(mouseDown) {
      // Don't move cursor while dragging.
      return;
    }

    const mousePos = this.getPointerPosition();
    mousePos.x = Math.round(mousePos.x / this.zResolution) * this.zResolution;

    if(mousePos.x >= (-this.width / 2) && mousePos.x <= (this.width / 2)) {
      this.cursorHover.x(
        mousePos.x + (this.width / 2) - (this.cursorWidth / 2));
      this.cursorHover.visible(true);
      this.canvas.layer.draw();
    }
  }

  private hideCursor() {
    this.cursorHover.visible(false);
    this.canvas.layer.draw();
  }
}

/* Relax permissions for testing. */
export class MockViewCrossSection extends ViewCrossSection {
  public layer: Konva.Layer;
  public lines: IHash = {};
  public mouseDown: boolean = false;
  public mouseDragStartPos: IPoint;
  public mouseDragStartLineId: string;
  public mouseDragStartEndId: LineEnd;
  public mockScreenMousePosX: number = 0;
  public mockScreenMousePosY: number = 0;
  public background: Konva.Group;
  public controller: MockController;

  public onMouseMove(event) {
    super.onMouseMove(event);
  }

  protected getPointerPosition(): {x: number, y: number} {
    return this.translateScreenToWidget(
      {x: this.mockScreenMousePosX, y: this.mockScreenMousePosY});
  }

  protected limitBounds(pos: {x: number, y: number}): {x: number, y: number} {
    return pos;
  }
}

export class ViewMock extends ViewBase {
  public buttonValues: IHash = {};
  public buttonStates: IHash = {};

  public setButtonValue(buttonLabel: string, value: number) {
    this.buttonValues[buttonLabel] = Boolean(value);
  }

  public setButtonState(buttonLabel: string, state: boolean) {
    this.buttonStates[buttonLabel] = state;
  }

  public simulateButtonPress(buttonLabel: string) {
    const event = new EventUiInputElement({
      widgetType: "testWidget",
      label: buttonLabel,
      elementType: "testLabel",
    });
    this.controller.onButtonEvent(event);
  }

  public simulateLineEvent(event: EventBase) {
    this.controller.onEvent(event);
  }
}

export class ViewToolbar extends ViewBase {
  public widgetType: string = "toolbar";
  private buttonElements: Element[];
  private backgroundDropDown: DropDown;
  private fileOpsDropDown: DropDown;

  constructor() {
    super();
    console.log("ViewToolbar()");

    this.buttonElements =
      [].slice.call(document.querySelectorAll(".pure-button"));
    this.buttonElements.forEach((button) => {
      button.addEventListener("click", this.onClick.bind(this));
    });

    const textInputs = [].slice.call(document.querySelectorAll(".auto-submit"));
    this.buttonElements = this.buttonElements.concat(textInputs);
    textInputs.forEach((testInput) => {
      testInput.addEventListener("change", this.onClick.bind(this));
    });

    this.backgroundDropDown = new DropDown(
      document.querySelector(".backgroundImage") as HTMLElement);

    this.fileOpsDropDown = new DropDown(
      document.querySelector(".fileOps") as HTMLElement);
  }

  public setButtonValue(buttonLabel: string, value: number) {
    // console.log(buttonLabel, value);

    const button = this.getButtonByLabel(buttonLabel);
    if(button) {
      if(value) {
        button.classList.add("pure-button-active");
      } else {
        button.classList.remove("pure-button-active");
      }
    }
    switch(buttonLabel) {
      case "backgroundImage":
        this.backgroundDropDown.show(Number(value));
        break;
      case "fileOps":
        this.fileOpsDropDown.show(Number(value));
        this.populateFileMenu(".fileOpsLoad");
        this.populateFileMenu(".fileOpsDelete");
        break;
      case "fileOpsSave":
      case "fileOpsDelete":
        this.populateFileMenu(".fileOpsLoad");
        this.populateFileMenu(".fileOpsDelete");
        break;
    }
  }

  public setBackgroundImage(backgroundImage: IBackgroundImage) {
    let visible;
    let url;
    if(backgroundImage.widgetType === "cross") {
      visible = document.getElementById("backgroundImageShowCross");
      url = document.getElementById("backgroundImageUrlCross");
    } else if(backgroundImage.widgetType === "length") {
      visible = document.getElementById("backgroundImageShowLength");
      url = document.getElementById("backgroundImageUrlLength");
    } else {
      console.assert(false && backgroundImage.widgetType);
    }

    visible.checked = backgroundImage.finishVisible;
    url.value = backgroundImage.finishImage;
  }

  public populateFileMenu(id: string) {
    const select = document.querySelector(id) as HTMLSelectElement;
    while(select.firstChild) {
      select.removeChild(select.firstChild);
    }
    const filenames: string[] = this.controller.getFilenames();
    filenames.forEach((filename) => {
      const option = document.createElement("option");
      option.text = filename;
      select.add(option);
    });
  }

  public setButtonState(buttonLabel: string, state: boolean) {
    const button = this.getButtonByLabel(buttonLabel);
    if(button) {
      if(state) {
        button.classList.remove("pure-button-disabled");
      } else {
        button.classList.add("pure-button-disabled");
      }
    }
  }

  private onClick(event: MouseEvent) {
    const button = event.currentTarget as Element;
    const buttonLabel = button.getAttribute("label");
    const input = event.srcElement as HTMLInputElement;
    const inputEvent = new EventUiInputElement({
      widgetType: this.widgetType,
      label: buttonLabel,
      elementType: "Button",
    });

    if(input && input.type && input.type === "checkbox") {
      inputEvent.valueBool = input.checked;
      inputEvent.elementType = "InputBool";
    }
    if(input && input.type && input.type === "text") {
      inputEvent.valueText = input.value;
      inputEvent.elementType = "InputText";
    }
    this.controller.onEvent(inputEvent);
  }

  private getButtonByLabel(buttonLabel: string): Element {
    let returnButton: Element;
    this.buttonElements.forEach((button) => {
      if(buttonLabel === button.getAttribute("label")) {
        returnButton = button;
      }
    });
    return returnButton;
  }
}

export class ViewThree extends ViewBase {
  public widgetType: string = "toolbar";
  public offsetX: number;
  public offsetY: number;
  public width: number;
  public height: number;
  private canvas: ViewCanvas;
  private scene: THREE.Scene;
  // private camera: THREE.PerspectiveCamera;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private lines: IHash = {};
  private mouseDown: boolean = false;
  private mouseLastX: number;
  private mouseLastY: number;


  constructor(canvas: ViewCanvas,
              x?: number,
              y?: number,
              width?: number,
              height?: number) {
    super();

    x = x || 0;
    y = y || 0;
    this.offsetX = x;
    this.offsetY = y;
    this.width = width || 400;
    this.height = height || 400;
    this.canvas = canvas;

    const container = document.querySelector("#canvas") as HTMLCanvasElement;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      -this.width, this.width, this.height, -this.height,  1, 10000 );
    // this.camera = new THREE.PerspectiveCamera(
    //  75, this.width / this.height, 0.1, 2000 );

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.width, this.height);
    const div = document.createElement("div");
    div.setAttribute("style",
      "position:absolute; top:" + this.offsetY + "px; " +
      "left:" + this.offsetX + "px;");
    div.appendChild(this.renderer.domElement);
    container.appendChild(div);

    div.addEventListener("mousedown", this.onMouseDown.bind(this), false);
    div.addEventListener("mouseup", this.onMouseUp.bind(this), false);
    div.addEventListener("mousemove", this.onMouseMove.bind(this), false);


    this.camera.position.set( -3000, 3000, -3000 );
    this.camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

    this.drawFrame();
  }

  public setButtonValue(buttonLabel: string, value: number) {
    // console.log(buttonLabel, value);
  }

  public updateLine(lineEvent: ILine) {
    console.log(lineEvent);
    console.assert(Boolean(lineEvent.id));

    if(!Boolean(lineEvent.finishPos)) {
      console.log("Delete", lineEvent.id);
      if(this.lines[lineEvent.id]) {
        delete this.lines[lineEvent.id];
      }
    } else if(lineEvent.finishPos) {
      this.lines[lineEvent.id] = lineEvent;
    }
    this.drawFrame();
  }

  private onMouseDown(event) {
    this.mouseDown = true;
    this.mouseLastX = event.clientX;
    this.mouseLastY = event.clientY;
  }

  private onMouseUp(event) {
    this.mouseDown = false;
  }

  private onMouseMove(event) {
    if(this.mouseDown) {
      if(this.mouseLastX !== undefined && this.mouseLastX !== undefined) {
        this.onDrag(this.mouseLastX - event.clientX,
          this.mouseLastY - event.clientY);
      }
      this.mouseLastX = event.clientX;
      this.mouseLastY = event.clientY;
    }
  }

  private onDrag(x: number, y: number) {
    console.log(x, y);
    requestAnimationFrame(this.cameraPan.bind(this, x / 100));
    requestAnimationFrame(this.cameraHeight.bind(this, y * 100));
  }

  private cameraPan(angle: number) {
    const angleCurrent =
      Math.atan2(this.camera.position.z, this.camera.position.x);
    const distCurrent =
      Math.sqrt(Math.pow(this.camera.position.z, 2) +
                Math.pow(this.camera.position.x, 2));

    this.camera.position.z = Math.sin(angleCurrent + angle) * distCurrent;
    this.camera.position.x = Math.cos(angleCurrent + angle) * distCurrent;

    this.camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

    this.renderer.render(this.scene, this.camera);
  }

  private cameraHeight(height: number) {
    this.camera.position.y += height;
    if(this.camera.position.y < -5000) {
      this.camera.position.y = -5000;
    }
    if(this.camera.position.y > 5000) {
      this.camera.position.y = 5000;
    }

    this.camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

    this.renderer.render(this.scene, this.camera);
  }

  private drawFrame() {
    console.log(this.lines);
    // requestAnimationFrame(this.drawFrame);

    while(this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    const materialSelect = new THREE.LineBasicMaterial( { color: 0xff8800 } );
    const materialBasic = new THREE.LineBasicMaterial( { color: 0x0000ff } );
    const materialCursor = new THREE.LineBasicMaterial( { color: 0xff0000 } );

    const geometryCursor = new THREE.Geometry();
    geometryCursor.vertices.push( new THREE.Vector3(0, 0, -600));
    geometryCursor.vertices.push( new THREE.Vector3(0, 0, 600));
    this.scene.add(new THREE.Line(geometryCursor, materialCursor));

    Object.getOwnPropertyNames(this.lines).forEach((lineId) => {
      const geometry1 = new THREE.Geometry();
      const geometry2 = new THREE.Geometry();
      const line = this.lines[lineId];
      const pointA = line.finishPos.a;
      const pointB = line.finishPos.b;
      geometry1.vertices.push(
        new THREE.Vector3(pointA.x, pointA.y, pointA.z));
      geometry1.vertices.push(
        new THREE.Vector3(pointB.x, pointB.y, pointB.z));
      if(line.selected) {
        this.scene.add(new THREE.Line(geometry1, materialSelect));
      } else {
        this.scene.add(new THREE.Line(geometry1, materialBasic));
      }

      if(line.mirrored) {
        geometry2.vertices.push(
          new THREE.Vector3(-pointA.x, pointA.y, pointA.z));
        geometry2.vertices.push(
          new THREE.Vector3(-pointB.x, pointB.y, pointB.z));
        if(line.selected) {
          this.scene.add(new THREE.Line(geometry2, materialSelect));
        } else {
          this.scene.add(new THREE.Line(geometry2, materialBasic));
        }
      }
    }, this);

    this.renderer.render(this.scene, this.camera);
  }
}

export class Line extends Konva.Group {
  public line1: Konva.Line;  // Primary line.
  public line2: Konva.Line;  // Mirrored line. (Not always set visible.)
  public end1A: Konva.Circle;
  public end2A: Konva.Circle;
  public end1B: Konva.Circle;
  public end2B: Konva.Circle;
  public mirrored: boolean;
  public z: number;
  private selectedValue: boolean;
  private highlightValue: boolean;
  private lineOverCallback: (event: MouseEvent) => void;

  constructor(id: string,
              lineOverCallback: (event: MouseEvent) => void) {
    super();

    this.id(id);
    this.lineOverCallback = lineOverCallback;
    this.mirrored = false;
    this.highlightValue = false;

    this.line1 = new Konva.Line(
      { points: [10, 10, 100, 100],
        stroke: "black",
        strokeWidth: 2,
      });
    this.line2 = new Konva.Line(
      { points: [-10, 10, -100, 100],
        stroke: "black",
        strokeWidth: 2,
        visible: false,
      });
    this.end1A = new Konva.Circle(
      { id: "end1A",
        x: 10,
        y: 10,
        radius: 5,
        stroke: "black",
        strokeWidth: 1,
        fill: "white",
      });
    this.end2A = new Konva.Circle(
      { id: "end2A",
        x: -10,
        y: 10,
        radius: 5,
        stroke: "black",
        strokeWidth: 1,
        fill: "white",
        visible: false,
      });
    this.end1B = new Konva.Circle(
      { id: "end1B",
        x: 100,
        y: 100,
        radius: 5,
        stroke: "black",
        strokeWidth: 1,
        fill: "white",
      });
    this.end2B = new Konva.Circle(
      { id: "end2B",
        x: -100,
        y: 100,
        radius: 5,
        stroke: "black",
        strokeWidth: 1,
        fill: "white",
        visible: false,
      });
    this.add(this.line1);
    this.add(this.line2);
    this.add(this.end1A);
    this.add(this.end2A);
    this.add(this.end1B);
    this.add(this.end2B);

    this.on("mouseover", this.onMouse.bind(this));
    this.on("mousedown", this.onMouse.bind(this));
    this.on("mouseup", this.onMouse.bind(this));
    this.on("mousemove", this.onMouse.bind(this));
  }

  public moveEnd(end: LineEnd, x: number, y: number) {
    switch(end) {
      case LineEnd.A1:
        this.end1A.x(x);
        this.end1A.y(y);
        break;
      case LineEnd.A2:
        this.end2A.x(x);
        this.end2A.y(y);
        break;
      case LineEnd.B1:
        this.end1B.x(x);
        this.end1B.y(y);
        break;
      case LineEnd.B2:
        this.end2B.x(x);
        this.end2B.y(y);
        break;
      default:
        console.log("TODO Move whole line");
    }
    this.line1.points(
      [this.end1A.x(), this.end1A.y(), this.end1B.x(), this.end1B.y()]);
    this.line2.points(
      [this.end2A.x(), this.end2A.y(), this.end2B.x(), this.end2B.y()]);
  }

  public selected(value?: boolean) {
    if(value === undefined) {
      return this.selectedValue;
    }
    this.selectedValue = value;
    if(value) {
      this.end1A.fill("orange");
      this.end2A.fill("orange");
      this.end1B.fill("orange");
      this.end2B.fill("orange");
      this.line1.stroke("orange");
      this.line2.stroke("orange");
      return this.selectedValue;
    }
    this.end1A.fill("white");
    this.end2A.fill("white");
    this.end1B.fill("white");
    this.end2B.fill("white");
    this.line1.stroke("black");
    this.line2.stroke("black");
    return this.selectedValue;
  }

  public highlight(value?: boolean) {
    if(value === undefined) {
      return this.highlightValue;
    }
    this.highlightValue = value;
    if(value) {
      this.end1A.strokeWidth(3);
      this.end2A.strokeWidth(3);
      this.end1B.strokeWidth(3);
      this.end2B.strokeWidth(3);
      this.line1.strokeWidth(3);
      this.line2.strokeWidth(3);
      this.moveToTop();
      return this.highlightValue;
    }
    this.end1A.strokeWidth(1);
    this.end2A.strokeWidth(1);
    this.end1B.strokeWidth(1);
    this.end2B.strokeWidth(1);
    this.line1.strokeWidth(2);
    this.line2.strokeWidth(2);
    return this.highlightValue;
  }

  public draw(): Konva.Node {
    this.end2A.visible(this.mirrored);
    this.end2B.visible(this.mirrored);
    this.line2.visible(this.mirrored);
    return super.draw();
  }

  public destroy() {
    this.destroyChildren();
    super.destroy();
  }

  public doesOverlap(shape: Konva.Node): boolean {
    const shapeBounds = shape.getClientRect();
    const line1Bounds = this.line1.getClientRect();
    const line2Bounds = this.line2.getClientRect();
    if(shapeBounds.x <= line1Bounds.x &&
       shapeBounds.x <= line1Bounds.x + line1Bounds.width &&
       shapeBounds.x + shapeBounds.width >= line1Bounds.x &&
       shapeBounds.x + shapeBounds.width >= line1Bounds.x + line1Bounds.width &&
       shapeBounds.y <= line1Bounds.y &&
       shapeBounds.y <= line1Bounds.y + line1Bounds.height &&
       shapeBounds.y + shapeBounds.height >= line1Bounds.y &&
       shapeBounds.y + shapeBounds.height >=
         line1Bounds.y + line1Bounds.height) {
      return true;
    }
    if(this.mirrored &&
       shapeBounds.x <= line2Bounds.x &&
       shapeBounds.x <= line2Bounds.x + line2Bounds.width &&
       shapeBounds.x + shapeBounds.width >= line2Bounds.x &&
       shapeBounds.x + shapeBounds.width >= line2Bounds.x + line2Bounds.width &&
       shapeBounds.y <= line2Bounds.y &&
       shapeBounds.y <= line2Bounds.y + line2Bounds.height &&
       shapeBounds.y + shapeBounds.height >= line2Bounds.y &&
       shapeBounds.y + shapeBounds.height >=
         line2Bounds.y + line2Bounds.height) {
      return true;
    }
    return false;
  }

  private onMouse(event: MouseEvent) {
    this.lineOverCallback(event);
  }
}
