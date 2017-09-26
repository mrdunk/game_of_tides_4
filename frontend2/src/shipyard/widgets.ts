// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import {CommandBuffer, ICommand} from "./command_buffer";
import {ComponentBuffer} from "./component_buffer";
import {
  AllRibs,
  BackgroundImage,
  Button2,
  ControlPanel,
  Modal,
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
  private modal: Modal;

  constructor() {
    this.rib = 0;
    this.selectedComponent = "";
    this.buttons = document.getElementsByClassName("pure-button");
    this.modal = new Modal();
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
        case "Download":
          button.addEventListener("click", this.modal.show.bind(this.modal));
          break;
        case "Background picture":
          button.addEventListener("click",
                                  this.onBackgroundPicture.bind(this));
          break;
        case "Clear all":
          button.addEventListener("click", this.modal.show.bind(this.modal));
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

    CommandBuffer.pushCallback(this.callback.bind(this));
    UserInterfaceClickCallbacks.push(this.controlCallback.bind(this));
  }

  public callback(command: ICommand): void {
    if(command.action === "changeRib") {
      this.rib = command.rib;
      this.selectedComponent = "";
    } else if(command.action === "lineMove" || command.action === "lineNew") {
      const line = ComponentBuffer.buffer[this.rib][this.selectedComponent];
      if(line) {
        this.setSelected("Mirror line", line.options.indexOf("mirror") >= 0);
      }
    }
    this.enableButtons();
  }

  public controlCallback(key: string, value: any) {
    console.log("controlCallback(key: ", key, ", value: ", value, ")");

    if(key.startsWith("line_")) {
      this.selectedComponent = "";

      const line = ComponentBuffer.buffer[this.rib][key];
      if(value && line) {
        this.selectedComponent = key;
        this.setSelected("Mirror line", line.options.indexOf("mirror") >= 0);
      }
    }

    switch(key) {
      case "allRibs":
        this.setSelected("View all layers", value);
        break;
    }

    this.enableButtons();
  }

  private onBackgroundPicture() {
    this.modal.clear();
    this.modal.show();
    const width = this.modal.element.offsetWidth;
    const height = this.modal.element.offsetHeight;
    const backgroundPicker = new BackgroundPicker(width, height);
    this.modal.add(backgroundPicker.element);
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
    this.enableLineSpecificButtons();
  }

  private enableLineSpecificButtons() {
    let line;
    if(ComponentBuffer.buffer[this.rib] &&
       ComponentBuffer.buffer[this.rib][this.selectedComponent]) {
      line = ComponentBuffer.buffer[this.rib][this.selectedComponent];
    }
    [].forEach.call(this.buttons, (button) => {
      const buttonLabel = button.getAttribute("data-balloon");
      switch(buttonLabel) {
        case "Delete line":
        case "Mirror line":
          if(line) {
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
  private allRibs: AllRibs;

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

    this.allRibs = new AllRibs();
    this.drawLayer.add(this.allRibs);
    this.allRibs.visible(false);

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
    let command: ICommand;
    switch(key) {
      case "Delete line":
        command = {
          action: "lineDelete",
          name: this.selectedLine.name(),
          rib: this.rib(),
          time: Date.now(),
          xa: this.selectedLine.a.x(),
          ya: this.selectedLine.a.y(),
          xb: this.selectedLine.b.x(),
          yb: this.selectedLine.b.y(),
          options: this.selectedLine.options.slice() as [string],
        };
        CommandBuffer.push(command);
        break;
      case "Mirror line":
        const options: [string] = [] as [string];
        if(value) {
          options.push("mirror");
        }

        command = {
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
      case "View all layers":
        this.allRibs.visible(!this.allRibs.visible());
        this.allRibs.draw();
        this.drawLayer.draw();
        UserInterfaceClickCallbacks.forEach((callback) => {
          callback("allRibs", this.allRibs.visible());
        });
        break;
    }
  }

  public callback(command: ICommand): void {
    console.log(command);
    if(command.action === "changeRib") {
      if(this.selectedLine) {
        this.selectedLine.unSelectHighlight();
        this.selectedLine = undefined;
      }
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
    this.allRibs.draw();
    this.drawLayer.draw();
  }

  public lineSelectCallback(lineName: string) {
    this.lineSelect(lineName);
  }

  public lineSelect(lineName: string) {
    if(this.selectedLine && this.selectedLine.rib === this.rib()) {
      this.selectedLine.unSelectHighlight();
    }
    this.selectedLine = this.buffer[this.rib()][lineName];
    this.selectedLine.selectHighlight(0);
    this.selectedLine.selectHighlight(1);

    UserInterfaceClickCallbacks.forEach((callback) => {
      callback(lineName, true);
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

    this.lineSelect(newLine.name());
  }

  private deleteLine(rib: number, name: string) {
    if(this.selectedLine.name() === name) {
      this.selectedLine.unSelectHighlight();
      this.selectedLine = undefined;
    }

    const line = this.buffer[rib][name];
    delete this.buffer[rib][name];
    line.destroyChildren();
    line.destroy();
    this.drawLayer.draw();
  }

  private setPositionLine(command: ICommand) {
    if(this.buffer[command.rib] === undefined) {
      return;
    }
    const line = this.buffer[command.rib][command.name];
    if(line === undefined) {
      return;
    }
    line.setPosition(command);

    this.lineSelect(command.name);
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

class BackgroundPicker {
  public element: HTMLDivElement;
  private image: HTMLDivElement;
  private stage: Konva.Stage;
  private content: BackgroundImage;
  private buttons: [HTMLDivElement];

  constructor(width: number, height: number) {
    this.element = document.createElement("div");
    this.buttons = [] as [HTMLDivElement];

    const template = document.querySelector("#BackgroundPickerTemplate");
    const buttons = template.querySelectorAll("div");
    for(let index = 0; index < buttons.length; index++) {
      const button = buttons[index];
      const clone = document.importNode(button, true);
      this.element.appendChild(clone);
      this.buttons.push(clone);

      const buttonLabel = clone.getAttribute("data-balloon");
      switch(buttonLabel) {
        case "Zoom in":
          clone.addEventListener("click", this.zoomIn.bind(this));
          break;
        case "Zoom out":
          clone.addEventListener("click", this.zoomOut.bind(this));
          break;
        case "Cross section":
          clone.addEventListener("click", this.toggleCrossSection.bind(this));
          break;
      }
    }

    this.content = new BackgroundImage(this.resizeCallback.bind(this));
    console.log(this.content.width(), this.content.height());

    this.image = document.createElement("div");
    this.image.id = "BackgroundPickerImage";
    this.element.appendChild(this.image);

    this.stage = new Konva.Stage({
      container: this.image,
      width: 800,  // Will resize when resizeCallback() is triggered.
      height: 800,
    });
    const layer = new Konva.Layer();

    layer.add(this.content);
    this.stage.add(layer);
    
    this.setButton("Cross section", this.content.viewCrossSection());
  }

  public resizeCallback() {
    this.stage.width(this.content.width());
    this.stage.height(this.content.height());
  }

  private zoomIn() {
    this.content.zoomIn();
  }

  private zoomOut() {
    this.content.zoomOut();
  }

  private toggleCrossSection() {
    this.content.viewCrossSection(!this.content.viewCrossSection());
    this.setButton("Cross section", this.content.viewCrossSection());
  }

  private setButton(label: string, value: boolean) {
    this.buttons.forEach((button) => {
      const buttonLabel = button.getAttribute("data-balloon");
      if(buttonLabel === label) {
        if(value) {
          button.classList.add("pure-button-active");
        } else {
          button.classList.remove("pure-button-active");
        }
      }
    });
  }
}
