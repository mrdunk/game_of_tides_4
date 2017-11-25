// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import {
  ControllerBase,
  ILine,
  ILineEvent,
  ILinePos,
  IPoint,
  MockController} from "./controller";

interface IHash {
  [key: string]: any;
}

export class ViewBase {
  protected static widgetIdConter: number = 0;
  protected controller: ControllerBase;
  protected sequence: string = "";
  private sequenceCounter: number = 0;
  private widgetId: number;

  constructor() {
    this.widgetId = ViewBase.widgetIdConter++;
  }

  public init(controller: ControllerBase) {
    this.controller = controller;
  }

  public setButtonValue(buttonLabel: string, value: boolean) {
    //
  }

  public setButtonState(buttonLabel: string, state: boolean) {
    //
  }

  public updateLine(lineEvent: ILine) {
    //
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
      width: 1000,  // TODO: Dynamic sizing
      height: 1000,
    });
    this.layer = new Konva.Layer();

    this.stage.add(this.layer);
  }
}

export abstract class ViewSection extends ViewBase {
  protected layer: Konva.Layer;
  protected lines: IHash = {};
  protected mouseDown: boolean = false;
  protected mouseDragging: Konva.Shape = null;
  protected mouseDraggingStartPos: ILinePos = null;
  protected mouseDrawingStartPos: IPoint = null;
  protected mouseHighlight: string = "";
  protected background: Konva.Group;
  protected width: number;
  protected height: number;
  protected geometry: Konva.Group;

  constructor(canvas: ViewCanvas,
              x?: number,
              y?: number,
              width?: number,
              height?: number) {
    super();

    x = x || 0;
    y = y || 0;
    this.width = width || 400;
    this.height = height || 400;

    this.layer = canvas.layer;

    this.background = new Konva.Group({
      x,
      y,
      width: this.width,
      height: this.height,
      draggable: false,
    });
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

    this.layer.draw();
  }

  protected onMouseMove(event) {
    const mouseDown = event.evt.buttons === 1;

    const parent: Line = event.target.getParent();
    let lineId;
    if(parent instanceof Line) {
      lineId = parent.id();
    }

    if(mouseDown) {
      if(!this.mouseDown) {
        // Mouse button not pressed last cycle.
        this.newSequence();
        if(lineId) {
          this.mouseDragging = event.target;
          this.mouseDraggingStartPos = JSON.parse(JSON.stringify(
            this.controller.getLine(lineId).finishPos));
        } else {
          // New line.
          this.mouseDrawingStartPos = this.getMousePosIn3d();
        }
      }
      if(this.mouseDragging) {
        // console.log("Dragging:", this.mouseDragging);
        const dragLineId = this.mouseDragging.getParent().id();
        const dragLinePos = this.controller.getLine(dragLineId).finishPos;
        const mouseDraggingEndPos =
          JSON.parse(JSON.stringify(this.mouseDraggingStartPos));
        if(this.mouseDragging.id() === "end1A") {
          mouseDraggingEndPos.a = this.getMousePosIn3d(dragLinePos.a);
        } else if(this.mouseDragging.id() === "end2A") {
          mouseDraggingEndPos.a = this.getMousePosIn3d(dragLinePos.a);
          mouseDraggingEndPos.a.x = -mouseDraggingEndPos.a.x;
        } else if(this.mouseDragging.id() === "end1B") {
          mouseDraggingEndPos.b = this.getMousePosIn3d(dragLinePos.b);
        } else if(this.mouseDragging.id() === "end2B") {
          mouseDraggingEndPos.b = this.getMousePosIn3d(dragLinePos.b);
          mouseDraggingEndPos.b.x = -mouseDraggingEndPos.b.x;
        }
        this.lineEvent(
          dragLineId,
          this.sequence,
          this.mouseDraggingStartPos,
          mouseDraggingEndPos);
      } else {
        const line: ILinePos = {
          a: this.mouseDrawingStartPos, b: this.getMousePosIn3d()};
        this.lineEvent(null, this.sequence, null, line);
      }
    } else {
      if(lineId) {
        // console.log("Highlight:", lineId);
        this.mouseHighlight = lineId;
        this.lineEvent(this.mouseHighlight, this.sequence, null, null, true);
      } else if(this.mouseHighlight) {
        // console.log("Un-highlight:", this.mouseHighlight);
        this.lineEvent(this.mouseHighlight, this.sequence, null, null, false);
        this.mouseHighlight = "";
      }
      this.mouseDragging = null;
      this.mouseDraggingStartPos = null;
      this.mouseDrawingStartPos = null;
    }
    this.mouseDown = mouseDown;
  }

  protected getPointerPosition(): {x: number, y: number} {
    const screenMousePos = this.layer.getStage().getPointerPosition();
    return this.translateScreenToWidget(
      {x: screenMousePos.x, y: screenMousePos.y});
  }

  protected translateWidgetToScreen(pos: {x: number, y: number}) {
    const x = Math.round(
      pos.x + (this.background.getWidth() /2));
    const y = Math.round(
      -pos.y + (this.background.getHeight() /2));
    return {x, y};
  }

  protected translateScreenToWidget(pos: {x: number, y: number}): {x: number, y: number} {
    return this.translateWidget(
      {x: pos.x - this.background.x(), y: pos.y - this.background.y()});
  }

  protected unhighlightAll() {
    Object.getOwnPropertyNames(this.lines).forEach((lineName) => {
      const line = this.lines[lineName];
      line.highlight(false);
    });
  }

  protected translateWidget(pos: {x: number, y: number}): {x: number, y: number} {
    const x = Math.round(
      pos.x - (this.background.getWidth() /2));
    const y = Math.round(
      -pos.y + (this.background.getHeight() /2));

    return {x, y};
  }

  protected abstract getMousePosIn3d(hint?: IPoint): IPoint;

  protected abstract lineEvent(id: string,
                               sequence: string,
                               startPos: ILinePos,
                               finishPos: ILinePos,
                               highlight?: boolean);
}

export class ViewCrossSection extends ViewSection {
  protected z: number = 100;

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

      line.moveEnd(line.end1A, a1.x, a1.y);
      line.moveEnd(line.end1B, b1.x, b1.y);
      line.moveEnd(line.end2A, a2.x, a2.y);
      line.moveEnd(line.end2B, b2.x, b2.y);
    }

    if(lineEvent.highlight !== undefined) {
      this.unhighlightAll();
      line.highlight(lineEvent.highlight);
    }
    if(lineEvent.mirrored !== undefined) {
      line.mirrored = lineEvent.mirrored;
      line.draw();
    }

    this.layer.draw();
  }

  protected getMousePosIn3d(hint?: IPoint): IPoint {
    const mousePos = this.getPointerPosition();
    return {x: mousePos.x, y: mousePos.y, z: this.z};
  }
  
  protected lineEvent(id: string,
                    sequence: string,
                    startPos: ILinePos,
                    finishPos: ILinePos,
                    highlight?: boolean) {
    const event: ILineEvent = {
      id,
      sequence,
      startPos,
      finishPos,
      highlight,
    };
    this.controller.onLineEvent(event);
  }
}

export class ViewLengthSection extends ViewSection {
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

      line.moveEnd(line.end1A, a1.x, a1.y);
      line.moveEnd(line.end1B, b1.x, b1.y);
    }

    if(lineEvent.highlight !== undefined) {
      this.unhighlightAll();
      line.highlight(lineEvent.highlight);
    }

    this.layer.draw();
  }

  protected getMousePosIn3d(hint?: IPoint): IPoint {
    let x = 0;
    if(hint) {
      x = hint.x;
    }
    const mousePos = this.getPointerPosition();
    return {x, y: mousePos.y, z: mousePos.x};
  }

  protected lineEvent(id: string,
                    sequence: string,
                    startPos: ILinePos,
                    finishPos: ILinePos,
                    highlight?: boolean) {
    if(startPos) {
      finishPos.a.z = startPos.a.z;
      finishPos.b.z = startPos.b.z;
    }
    const event: ILineEvent = {
      id,
      sequence,
      startPos,
      finishPos,
      highlight,
    };
    this.controller.onLineEvent(event);
  }
}

export class MockViewCrossSection extends ViewCrossSection {
  public layer: Konva.Layer;
  public lines: IHash = {};
  public mouseDown: boolean = false;
  public mouseDragging: Konva.Shape = null;
  public mouseDraggingStartPos: ILinePos = null;
  public mouseDrawingStartPos: IPoint = null;
  public mouseHighlight: string = "";
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
}

export class ViewMock extends ViewBase {
  public buttonValues: IHash = {};
  public buttonStates: IHash = {};

  public setButtonValue(buttonLabel: string, value: boolean) {
    this.buttonValues[buttonLabel] = value;
  }

  public setButtonState(buttonLabel: string, state: boolean) {
    this.buttonStates[buttonLabel] = state;
  }

  public simulateButtonPress(buttonLabel: string) {
    this.controller.onButtonEvent(buttonLabel);
  }

  public simulateLineEvent(id: string,
                           sequence: string,
                           startPos: ILinePos,
                           finishPos: ILinePos,
                           highlight?: boolean) {
    const event: ILineEvent = {
      id,
      sequence,
      startPos,
      finishPos,
      highlight,
    };
    this.controller.onLineEvent(event);
  }
}

export class ViewToolbar extends ViewBase {
  private buttonElements: Element[];

  constructor() {
    super();
    console.log("ViewToolbar()");

    this.buttonElements =
      [].slice.call(document.querySelectorAll(".pure-button"));
    this.buttonElements.forEach((button) => {
      button.addEventListener("click", this.onClick.bind(this));
    });
  }

  public setButtonValue(buttonLabel: string, value: boolean) {
    const button = this.getButtonByLabel(buttonLabel);
    if(button) {
      if(value) {
        button.classList.add("pure-button-active");
      } else {
        button.classList.remove("pure-button-active");
      }
    }
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
    this.controller.onButtonEvent(buttonLabel);
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

export class Line extends Konva.Group {
  public line1: Konva.Line;  // Primary line.
  public line2: Konva.Line;  // Mirrored line. (Not always set visible.)
  public end1A: Konva.Circle;
  public end2A: Konva.Circle;
  public end1B: Konva.Circle;
  public end2B: Konva.Circle;
  public mirrored: boolean;
  private highlightValue: boolean;
  private lineOverCallback: (event: MouseEvent) => void;

  constructor(id: string,
              lineOverCallback: (event: MouseEvent) => void) {
    super();

    console.log(id);

    this.id(id);
    this.lineOverCallback = lineOverCallback;
    this.mirrored = false;
    this.highlightValue = false;

    this.line1 = new Konva.Line(
      { points: [10, 10, 100, 100],
        stroke: "black",
        strokeWidth: 1,
      });
    this.line2 = new Konva.Line(
      { points: [-10, 10, -100, 100],
        stroke: "black",
        strokeWidth: 1,
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

  public moveEnd(end: Konva.Circle, x: number, y: number) {
    if(end === this.end1A) {
      this.end1A.x(x);
      this.end1A.y(y);
    } else if(end === this.end2A) {
      this.end2A.x(x);
      this.end2A.y(y);
    } else if(end === this.end1B) {
      this.end1B.x(x);
      this.end1B.y(y);
    } else if(end === this.end2B) {
      this.end2B.x(x);
      this.end2B.y(y);
    }
    this.line1.points(
      [this.end1A.x(), this.end1A.y(), this.end1B.x(), this.end1B.y()]);
    this.line2.points(
      [this.end2A.x(), this.end2A.y(), this.end2B.x(), this.end2B.y()]);
  }

  public highlight(value?: boolean) {
    if(value === undefined) {
      return this.highlightValue;
    }
    this.highlightValue = value;
    if(value) {
      this.end1A.fill("orange");
      this.end2A.fill("orange");
      this.end1B.fill("orange");
      this.end2B.fill("orange");
      this.line1.stroke("orange");
      this.line2.stroke("orange");
      return this.highlightValue;
    }
    this.end1A.fill("white");
    this.end2A.fill("white");
    this.end1B.fill("white");
    this.end2B.fill("white");
    this.line1.stroke("black");
    this.line2.stroke("black");
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

  private onMouse(event: MouseEvent) {
    this.lineOverCallback(event);
  }
}
