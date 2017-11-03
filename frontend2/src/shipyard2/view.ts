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
  private mouseDragging: string = "";
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

    this.geometry.add(new Line("testLine1", this.onLineOver.bind(this)));

    this.layer.draw();
  }

  private translateScreenToWidget(pos: {x: number, y: number}): IPoint {
    const x = Math.round(
      pos.x - this.background.x() - (this.background.getWidth() /2));
    const y = Math.round(
      -pos.y + this.background.y() + (this.background.getHeight() /2));

    if(this.aspect === "xy") {
      return {x, y, z: 0};
    } else if(this.aspect === "zy") {
      return {x: 0, y, z: x};
    }
    // else if(this.aspect === "xz") {
    return {x, y: 0, z: y};
  }

  private onMouseMove(event) {
    this.mouseDown = event.evt.buttons === 1;

    const lineId = event.target.parent.id();

    if(this.mouseDown) {
      const mousePos = this.layer.getStage().getPointerPosition();
      if(lineId) {
        this.mouseDragging = lineId;
      }
      if(this.mouseDragging) {
        console.log("Dragging:", this.mouseDragging);
      } else {
        console.log("Drawing:", this.translateScreenToWidget(mousePos));
      }
    } else {
      if(lineId) {
        console.log("Highlight:", lineId);
        this.mouseHighlight = lineId;
      } else if(this.mouseHighlight) {
        console.log("Un-highlight:", this.mouseHighlight);
        this.mouseHighlight = "";
      }
      this.mouseDragging = "";
    }
  }

  private onLineOver(event) {
    this.onMouseMove(event);
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
                           finishPos: ILinePos) {
    const event: ILineEvent = {
      id,
      startPos,
      finishPos,
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
  private line: Konva.Line;
  private endA: Konva.Circle;
  private endB: Konva.Circle;
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
      { x: 10,
        y: 10,
        radius: 5,
        stroke: "black",
        strokeWidth: 1,
        fill: "white",
      });
    this.endB = new Konva.Circle(
      { x: 100,
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
