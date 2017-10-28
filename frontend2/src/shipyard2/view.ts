// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import {Controller, ILineEvent, ILinePos} from "./controller";

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
        width: 500,
        height: 500,
    });
    this.layer = new Konva.Layer();

    this.stage.add(this.layer);
  }
}

export class ViewCrossSection extends ViewBase {
  private layer: Konva.Stage;
  private background: Konva.Group;

  constructor(canvas: ViewCanvas) {
    super();
    console.log("ViewCrossSection()");

    this.layer = canvas.layer;

    this.background = new Konva.Group({
      width: 400,
      height: 400,
      draggable: false,
    });
    canvas.layer.add(this.background);

    const rectangle = new Konva.Rect({
      x: this.background.x(),
      y: this.background.y(),
      width: this.background.width(),
      height: this.background.height(),
      fill: "red",
      stroke: "black",
      strokeWidth: 1
    });

    const midline = new Konva.Line({
      points: [
        (this.background.width() - this.background.x()) / 2,
        0,
        (this.background.width() - this.background.x()) / 2,
        this.background.height() - this.background.y() ],
      stroke: "black",
    });

    this.background.add(rectangle);
    this.background.add(midline);
    this.layer.draw();
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
