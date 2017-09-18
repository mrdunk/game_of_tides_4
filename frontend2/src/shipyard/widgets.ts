// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import {CommandBuffer, ICommand} from "./command_buffer";
import {ComponentBuffer} from "./component_buffer";
import {
  Button2,
  ControlPanel,
  MovableLine,
  Scale,
  StaticLine} from "./primatives";

interface ICrossSectionBuffer {
  [rib: number]: {
    [name: string]: MovableLine;
  };
}

interface ISideViewBuffer {
  [rib: number]: {
    [name: string]: StaticLine;
  };
}

const UserInterfaceClickCallbacks = [];

export class Controls {
  private rib: number;
  private selectedComponent: string;
  private buttons: HTMLCollectionOf<Element>;
  constructor() {
    this.rib = 0;
    this.selectedComponent = "";
    this.buttons = document.getElementsByClassName("pure-button");
    [].forEach.call(this.buttons, (button) => {
      const buttonLabel = button.getAttribute("data-balloon");
      switch(buttonLabel) {
        case "Undo":
          button.addEventListener("click", CommandBuffer.undo);
          break;
        case "Redo":
          button.addEventListener("click", CommandBuffer.redo);
          break;
        case "Add line":
          button.addEventListener("click", (buttonName) => {
            const command: ICommand = {
              action: "lineNew",
              name: MovableLine.makeName(),
              rib: this.rib,
              time: Date.now(),
              options: ["mirror"],
            };
            CommandBuffer.push(command);
          });
          break;
        case "Upload":
          button.addEventListener("click", CommandBuffer.save);
          break;
        default:
          // Any button clicks that are not used here should be sent on to all
          // other registered listeners.
          button.addEventListener("click",
                                  () => {this.sendToListiners(buttonLabel);});
          break;
      }
    });

    this.enableButtons();
    this.enableLineSpecific(false);

    CommandBuffer.pushCallback(this.callback.bind(this));
    UserInterfaceClickCallbacks.push(this.controlCallback.bind(this));
  }

  public callback(command: ICommand): void {
    this.enableButtons();
    if(command.action === "changeRib") {
      this.rib = command.rib;
    } else if(command.action === "lineMove" || command.action === "lineNew") {
      const line = ComponentBuffer.buffer[this.rib][this.selectedComponent];
      if(line) {
        this.setSelected("Mirror line", line.options.indexOf("mirror") >= 0);
      }
    }
  }

  public controlCallback(key: string, value: any) {
    console.log("controlCallback(key: ", key, ", value: ", value, ")");

    this.enableButtons();
    if(key.startsWith("line_")) {
      const line = ComponentBuffer.buffer[this.rib][key];
      this.enableLineSpecific(value);

      this.selectedComponent = "";
      if(value) {
        this.selectedComponent = key;
        this.setSelected("Mirror line", line.options.indexOf("mirror") >= 0);
      }

      return;
    }
  }

  private enableButtons() {
    [].forEach.call(this.buttons, (button) => {
      const buttonLabel = button.getAttribute("data-balloon");
      switch(buttonLabel) {
        case "Undo":
          if(CommandBuffer.undoAvaliable()) {
            button.classList.remove("pure-button-disabled");
          } else {
            button.classList.add("pure-button-disabled");
          }
          break;
        case "Redo":
          if(CommandBuffer.redoAvaliable()) {
            button.classList.remove("pure-button-disabled");
          } else {
            button.classList.add("pure-button-disabled");
          }
          break;
      }
    });
  }

  private enableLineSpecific(value: boolean) {
    [].forEach.call(this.buttons, (button) => {
      const buttonLabel = button.getAttribute("data-balloon");
      switch(buttonLabel) {
        case "Delete":
        case "Mirror line":
          if(value) {
            button.classList.remove("pure-button-disabled");
          } else {
            button.classList.add("pure-button-disabled");
          }
          break;
      }
    });
  }

  private setSelected(buttonLabel: string, value: boolean) {
    const button = this.getButton(buttonLabel);
    if(value) {
      button.classList.add("pure-button-active");
    } else {
      button.classList.remove("pure-button-active");
    }
  }

  private getButton(buttonLabel: string): Element {
    let returnVal: Element;
    [].forEach.call(this.buttons, (button) => {
      if(buttonLabel === button.getAttribute("data-balloon")) {
        returnVal = button;
      }
    });
    return returnVal;
  }

  private sendToListiners(buttonLabel: string) {
    const button = this.getButton(buttonLabel);
    const value = !button.classList.contains("pure-button-active");
    UserInterfaceClickCallbacks.forEach((callback) => {
      callback(buttonLabel, value);
    });
  }
}


export class CrossSection extends Konva.Stage {
  private ribValue: number;
  private controlPannel: ControlPanel;
  private drawLayer: Konva.Layer;
  private buffer: ICrossSectionBuffer;
  private selectedLine: MovableLine;

  constructor() {
    const container = document.getElementById("crossSection");
    super({
      container: "crossSection",
      width: container.offsetWidth,
      height: container.offsetHeight,
    });

    this.buffer = {};
    this.rib(0);
    this.buffer[this.rib()] = {};

    this.drawLayer = new Konva.Layer();
    this.drawLayer.offsetX(- container.offsetWidth / 2);
    this.drawLayer.offsetY(- container.offsetHeight / 2);
    this.add(this.drawLayer);

    const scale = new Scale();
    this.drawLayer.add(scale);
    scale.draw();

    const controlLayer = new Konva.Layer();
    this.add(controlLayer);
    this.controlPannel = new ControlPanel();
    this.controlPannel.addText(this, "rib", "lightgreen");
    this.controlPannel.addButton("test2", (buttonName) => {
      console.log(CommandBuffer.summary());
      console.log(ComponentBuffer.show());
      console.log(this.buffer);
    }, "green");
    controlLayer.add(this.controlPannel);

    this.drawLayer.draw();
    controlLayer.draw();

    CommandBuffer.pushCallback(this.callback.bind(this));
    UserInterfaceClickCallbacks.push(this.controlCallback.bind(this));
  }

  public controlCallback(key: string, value: any) {
    console.log("controlCallback(key: ", key, ", value: ", value, ")");

    switch(key) {
      case "Mirror line":
        const options: [string] = [] as [string];
        if(value) {
          options.push("mirror");
        }

        const command: ICommand = {
          action: "lineMove",
          name: this.selectedLine.name(),
          rib: this.rib(),
          time: Date.now(),
          xa: this.selectedLine.a.x(),
          ya: this.selectedLine.a.y(),
          xb: this.selectedLine.b.x(),
          yb: this.selectedLine.b.y(),
          options,
        };
        CommandBuffer.push(command);
        break;
    }
  }

  public callback(command: ICommand): void {
    if(command.action === "changeRib") {
      this.clearDisplay();
      this.rib(command.rib);
      this.controlPannel.draw();
      this.restoreDisplay();
    } else if(command.action === "lineDelete") {
      this.deleteLine(command.rib, command.name);
    } else if(command.action === "lineNew") {
      this.addLine(command.rib, command.name, command.options);
    } else if(command.action === "lineMove") {
      this.setPositionLine(command);
    }
    this.drawLayer.draw();
  }

  public lineSelectCallback(lineName: string, value: boolean) {
    console.log(lineName);

    this.selectedLine = this.buffer[this.rib()][lineName];

    UserInterfaceClickCallbacks.forEach((callback) => {
      callback(lineName, value);
    });
  }

  private addLine(rib: number, name?: string, options?: [string]) {
    console.log(rib, name);
    if(rib === undefined) {
      rib = this.rib();
    }
    const newLine =
      new MovableLine(this.lineSelectCallback.bind(this),
                      rib,
                      this.buffer[this.rib()],
                      name,
                      options);
    this.drawLayer.add(newLine);
    this.drawLayer.draw();
    if(!this.buffer[rib]) {
      this.buffer[rib] = {};
    }
    this.buffer[rib][newLine.name()] = newLine;
  }

  private deleteLine(rib: number, name: string) {
    const line = this.buffer[rib][name];
    delete this.buffer[rib][name];
    line.destroyChildren();
    line.destroy();
    this.drawLayer.draw();
  }

  private setPositionLine(command: ICommand) {
    const line = this.buffer[command.rib][command.name];
    if(line === undefined) {
      return;
    }
    line.setPosition(command);
  }

  private rib(rib?: number) {
    if(rib === undefined) {
      return this.ribValue;
    }
    this.ribValue = rib;
  }

  private clearDisplay() {
    console.log("clearDisplay()", this.rib());
    for(const name in this.buffer[this.rib()]) {
      if(this.buffer[this.rib()].hasOwnProperty(name)) {
        const component = this.buffer[this.rib()][name];
        component.remove();
      }
    }
    this.drawLayer.draw();
  }

  private restoreDisplay() {
    for(const name in this.buffer[this.rib()]) {
      if(this.buffer[this.rib()].hasOwnProperty(name)) {
        const component = this.buffer[this.rib()][name];
        this.drawLayer.add(component);
      }
    }
    this.drawLayer.draw();
  }

}

export class SideView extends Konva.Stage {
  private static snapDistance: number = 50;
  private cursor: Konva.Line;
  private background: Scale;
  private buffer: ISideViewBuffer;
  private drawLayer: Konva.Layer;

  constructor() {
    const container = document.getElementById("sideView");
    super({
      container: "sideView",
      width: container.offsetWidth,
      height: container.offsetHeight,
    });

    this.buffer = {};

    this.offsetX(- container.offsetWidth / 2);
    this.offsetY(- container.offsetHeight / 2);

    this.drawLayer = new Konva.Layer();
    // this.drawLayer.offsetX(- container.offsetWidth / 2);
    // this.drawLayer.offsetY(- container.offsetHeight / 2);
    this.add(this.drawLayer);

    this.background = new Scale();
    this.drawLayer.add(this.background);
    this.background.draw();

    this.drawLayer.draw();

    this.cursor = new Konva.Line({
      stroke: "lightgrey",
      strokeWidth: 8,
      points: [],
    });
    this.cursor.visible(false);
    this.drawLayer.add(this.cursor);

    CommandBuffer.pushCallback(this.callback.bind(this));
    UserInterfaceClickCallbacks.push(this.controlCallback.bind(this));

    this.on("contentClick", () => {
      const mousePos = this.getStage().getPointerPosition();
      this.setRib(mousePos.x + this.offsetX());
    });
    this.on("contentMousemove", () => {
      const mousePos = this.getStage().getPointerPosition();
      this.setCursor(mousePos.x + this.offsetX(), mousePos.y + this.offsetY());
    });
  }

  public controlCallback(key: string, value: any) {
    console.log("controlCallback(key: ", key, ", value: ", value, ")");
  }

  public callback(command: ICommand): void {
    if(command.action === "changeRib") {
      this.background.rib = command.rib;
      this.background.draw();
      this.cursor.visible(false);
      this.background.getLayer().draw();
    } else if(command.action === "lineNew" || command.action === "lineMove" ) {
      this.addLine(command);
    } else if(command.action === "lineDelete") {
      this.deleteLine(command.rib, command.name);
    }
  }

  private addLine(command: ICommand) {
    if(!this.buffer[command.rib]) {
      this.buffer[command.rib] = {};
    }
    let component = this.buffer[command.rib][command.name];
    if(component) {
      if(component.destroyChildren) {
        component.destroyChildren();
      }
      component.destroy();
    }
    component =  new StaticLine(command);
    this.buffer[command.rib][command.name] = component;
    this.drawLayer.add(component);
    this.draw();
  }

  private deleteLine(rib: number, name: string) {
    const line = this.buffer[rib][name];
    delete this.buffer[rib][name];
    line.destroyChildren();
    line.destroy();
    this.drawLayer.draw();
  }

  private setRib(posX) {
    const rib = Math.round(posX / SideView.snapDistance);
    console.log(rib);
    const command: ICommand = {
      action: "changeRib",
      name: "changeRib",
      rib,
      time: Date.now(),
    };
    CommandBuffer.push(command);
    this.background.rib = rib;
    this.background.draw();
    this.cursor.visible(false);
    this.background.getLayer().draw();
  }

  private setCursor(posX, posY) {
    posX = Math.round(posX / SideView.snapDistance) * SideView.snapDistance;
    this.cursor.points([posX, -this.height() /2, posX, this.height() /2]);
    this.cursor.visible(true);
    this.background.getLayer().draw();
  }
}

