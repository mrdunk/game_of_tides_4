// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import {Controller, ILineEvent, ILinePos, IPoint} from "./controller";

interface IHash {
  [key: string]: any;
}

export class ViewBase {
  protected controller: Controller;

  constructor() {
    //
  }

  public init(controller: Controller) {
    this.controller = controller;
  }

  public setButtonValue(buttonLabel: string, value: boolean) {
    //
  }

  public setButtonState(buttonLabel: string, state: boolean) {
    //
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
        width: 500,
        height: 500,
    });
    this.layer = new Konva.Layer();

    this.stage.add(this.layer);
  }
}

export class ViewCrossSection extends ViewBase {
  private layer: Konva.Layer;
  private background: Konva.Group;
  private geometry: Konva.Group;
  private mouseDown: boolean = false;
  private mouseDragging: Konva.Shape = null;
  private mouseDraggingStartPos: ILinePos = null;
  private mouseDrawingStartPos: IPoint = null;
  private mouseHighlight: string = "";
  private aspect: string = "xy";

  constructor(canvas: ViewCanvas, x?: number, y?: number) {
    super();
    console.log("ViewCrossSection()");

    x = x || 0;
    y = y || 0;

    this.layer = canvas.layer;

    this.background = new Konva.Group({
      x,
      y,
      width: 400,
      height: 400,
      draggable: false,
    });
    canvas.layer.add(this.background);

    this.geometry = new Konva.Group({
      x,
      y,
      width: 400,
      height: 400,
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

    const midline = new Konva.Line({
      points: [
        this.background.width() / 2,
        0,
        this.background.width() / 2,
        this.background.height() ],
      stroke: "grey",
    });

    this.background.on("mousemove", this.onMouseMove.bind(this));

    this.background.add(sky);
    this.background.add(sea);
    this.background.add(midline);

    this.geometry.add(new Line("testLine1", this.onMouseMove.bind(this)));

    this.layer.draw();
  }

  private translateScreenToWidget(pos: {x: number, y: number}): IPoint {
    return this.translateWidget(
      {x: pos.x - this.background.x(), y: pos.y - this.background.y()});
  }

  private translateWidget(pos: {x: number, y: number}): IPoint {
    const x = Math.round(
      pos.x - (this.background.getWidth() /2));
    const y = Math.round(
      -pos.y + (this.background.getHeight() /2));

    if(this.aspect === "xy") {
      return {x, y, z: 0};
    } else if(this.aspect === "zy") {
      return {x: 0, y, z: x};
    }
    // else if(this.aspect === "xz") {
    return {x, y: 0, z: y};
  }

  private getPointerPosition(): {x: number, y: number} {
    const screenMousePos = this.layer.getStage().getPointerPosition();
    return this.translateScreenToWidget(
      {x: screenMousePos.x, y: screenMousePos.y});
  }

  private onMouseMove(event) {
    this.mouseDown = event.evt.buttons === 1;

    const parent: Line = event.target.getParent();
    const lineId = parent.id();

    if(this.mouseDown) {
      const mousePos = this.getPointerPosition();
      if(!this.mouseDragging && !this.mouseDrawingStartPos) {
        if(lineId) {
          this.mouseDragging = event.target;

          const points = parent.line.points();
          const a: IPoint = this.translateWidget({x: points[0], y: points[1]});
          const b: IPoint = this.translateWidget({x: points[2], y: points[3]});
          this.mouseDraggingStartPos = {a, b};
        } else if(!lineId) {
          this.mouseDrawingStartPos = {x: mousePos.x, y: mousePos.y, z: 0};
        }
      }
      if(this.mouseDragging) {
        console.log("Dragging:", this.mouseDragging);
        const points = (this.mouseDragging.getParent() as Line).line.points();
        const mouseDraggingEndPos =
          JSON.parse(JSON.stringify(this.mouseDraggingStartPos));
        if(this.mouseDragging.id() === "endA") {
          mouseDraggingEndPos.a.x = mousePos.x;
          mouseDraggingEndPos.a.y = mousePos.y;
        } else if(this.mouseDragging.id() === "endB") {
          mouseDraggingEndPos.b.x = mousePos.x;
          mouseDraggingEndPos.b.y = mousePos.y;
        }
        this.lineEvent(
          this.mouseDragging.getParent().id(),
          this.mouseDraggingStartPos,
          mouseDraggingEndPos);
      } else {
        console.log("Drawing:", this.translateScreenToWidget(mousePos));
        const endPoint: IPoint = {x: mousePos.x, y: mousePos.y, z: 0};
        const line: ILinePos = {a: this.mouseDrawingStartPos, b: endPoint};
        this.lineEvent(null, null, line);
      }
    } else {
      if(lineId) {
        console.log("Highlight:", lineId);
        this.mouseHighlight = lineId;
        this.lineEvent(this.mouseHighlight, null, null);
      } else if(this.mouseHighlight) {
        console.log("Un-highlight:", this.mouseHighlight);
        this.lineEvent(this.mouseHighlight, null, null);
        this.mouseHighlight = "";
      }
      this.mouseDragging = null;
      this.mouseDraggingStartPos = null;
      this.mouseDrawingStartPos = null;
    }
  }

  private lineEvent(id: string, startPos: ILinePos, finishPos: ILinePos) {
    const event: ILineEvent = {
      id,
      startPos,
      finishPos,
    };
    this.controller.onLineEvent(event);
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
                           startPos: ILinePos,
                           finishPos: ILinePos,
                           highlight?: boolean) {
    const event: ILineEvent = {
      id,
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

  private onClick(event: Event) {
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

class Line extends Konva.Group {
  public line: Konva.Line;
  public endA: Konva.Circle;
  public endB: Konva.Circle;
  private lineOverCallback: (event: Event) => void;

  constructor(id: string,
              lineOverCallback: (event: Event) => void) {
    super();

    this.id(id);
    this.lineOverCallback = lineOverCallback;

    this.line = new Konva.Line(
      { points: [10, 10, 100, 100],
        stroke: "black",
        strokeWidth: 1,
      });
    this.endA = new Konva.Circle(
      { id: "endA",
        x: 10,
        y: 10,
        radius: 5,
        stroke: "black",
        strokeWidth: 1,
        fill: "white",
      });
    this.endB = new Konva.Circle(
      { id: "endB",
        x: 100,
        y: 100,
        radius: 5,
        stroke: "black",
        strokeWidth: 1,
        fill: "white",
      });
    this.add(this.line);
    this.add(this.endA);
    this.add(this.endB);

    this.on("mouseover", this.onMouse.bind(this));
    this.on("mousedown", this.onMouse.bind(this));
    this.on("mouseup", this.onMouse.bind(this));
    this.on("mousemove", this.onMouse.bind(this));
  }

  public moveEnd(end: Konva.Circle, x: number, y: number) {
    if(end === this.endA) {
      this.endA.x(x);
      this.endA.y(y);
    } else {
      this.endB.x(x);
      this.endB.y(y);
    }
    this.line.points(
      [this.endA.x(), this.endA.y(), this.endB.x(), this.endB.y()]);
  }

  private onMouse(event: Event) {
    console.log(event);
    this.lineOverCallback(event);
  }
}
