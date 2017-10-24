// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import {CommandBuffer, ICommand} from "./command_buffer";
import {ComponentBuffer} from "./component_buffer";
import {ImageLoader} from "./image_loader";
import {
  AllRibs,
  BackgroundImage,
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
  private backgroundPicker: BackgroundPicker;
  private ribPicker: Node;

  constructor() {
    this.rib = 0;
    this.selectedComponent = "";
    this.modal = new Modal();
    const width = this.modal.element.offsetWidth;
    const height = this.modal.element.offsetHeight;
    this.backgroundPicker = new BackgroundPicker(width, height);

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
          button.addEventListener("click", () => {
            const filename = "user_saved";
            CommandBuffer.save(filename);
          });
          break;
        case "Download":
          button.addEventListener("click", () => {
            location.hash = "#user_saved";
          });
          break;
        case "Background picture":
          button.addEventListener("click",
                                  this.onBackgroundPicture.bind(this));
          break;
        case "Clear all":
          button.addEventListener("click", this.clearAllData.bind(this));
          break;
        case "Rib":
          this.ribPicker = button;
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
    if(command.action === "selectRib") {
      this.selectRib(command.rib);
    } else if(command.action === "lineMove" || command.action === "lineNew") {
      const line = ComponentBuffer.buffer[this.rib][this.selectedComponent];
      if(line) {
        this.setSelected("Mirror line", line.options.indexOf("mirror") >= 0);
      }
    }
    this.enableButtons();
  }

  public controlCallback(key: string, value: any) {
    // console.log("controlCallback(key: ", key, ", value: ", value, ")");

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
      case "Rib":
        console.log("controlCallback(key: ", key, ", value: ", value, ")");
        const command: ICommand = {
          action: "selectRib",
          name: "selectRib",
          rib: parseInt(value, 10),
          time: Date.now(),
        };
        CommandBuffer.push(command);
        break;
    }

    this.enableButtons();
  }

  private clearAllData() {
    CommandBuffer.save("state_before_clear");
    location.hash = "#noLoad";
    location.reload();
  }

  private selectRib(selectedRib: number) {
    this.rib = selectedRib;
    this.selectedComponent = "";
    this.ribPicker.childNodes.forEach((node) => {
      if(node.getAttribute && node.getAttribute("type") === "number") {
        node.value = selectedRib;
      }
    });
  }

  private onBackgroundPicture() {
    this.modal.clear();
    this.modal.show();
    this.modal.add(this.backgroundPicker.element);
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
    let value = !button.classList.contains("pure-button-active");
    console.log(button.childNodes);
    button.childNodes.forEach((node) => {
      if(node.getAttribute && node.getAttribute("type") === "number") {
        console.log(node);
        value = node.value;
      }
    });
    UserInterfaceClickCallbacks.forEach((callback) => {
      callback(buttonLabel, value);
    });
  }
}


export class CrossSection extends Konva.Stage {
  private ribValue: number;
  private drawLayer: Konva.Layer;
  private buffer: ICrossSectionBuffer;
  private selectedLine: MovableLine;
  private allRibs: AllRibs;
  private background: Scale;

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

    const imageUrl =
      "https://upload.wikimedia.org/wikipedia/commons/" +
      "9/91/Plan_of_HMS_Surprise.jpg";
    this.background = new Scale(imageUrl);
    this.drawLayer.add(this.background);
    this.background.draw();

    this.allRibs = new AllRibs();
    this.drawLayer.add(this.allRibs);
    this.allRibs.visible(false);

    this.drawLayer.draw();

    CommandBuffer.pushCallback(this.callback.bind(this));
    UserInterfaceClickCallbacks.push(this.controlCallback.bind(this));
  }

  public controlCallback(key: string, value: any) {
    // console.log("controlCallback(key: ", key, ", value: ", value, ")");
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
      case "backgroundMove":
        if(value[0] === "crossSection") {
          console.log(value);
          this.background.updateBackgroundImage({
            offsetX: value[1],
            offsetY: value[2],
            scaleX: value[3],
            scaleY: value[4],
          });
        }
        break;
      case "backgroundToggle":
        if(value[0] === "crossSection") {
          console.log(value, this.background);
          this.background.backgroundImage.visible(value[1]);
          this.background.draw();
        }
        break;
      case "gridToggle":
        this.background.grid.visible(value[0]);
        this.draw();
        break;
    }
  }

  public callback(command: ICommand): void {
    console.log(command);
    switch(command.action) {
      case "selectRib":
        if(this.selectedLine) {
          this.selectedLine.unSelectHighlight();
          this.selectedLine = undefined;
        }
        this.clearDisplay();
        this.rib(command.rib);
        this.restoreDisplay();
        break;
      case "lineDelete":
        this.deleteLine(command.rib, command.name);
        break;
      case "lineNew":
        this.addLine(command.rib, command.name, command.options);
        break;
      case "lineMove":
        this.setPositionLine(command);
        break;
      case "clearAll":
        this.clearDisplay();
        break;
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
    if(this.selectedLine && this.selectedLine.name() === name) {
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
  private rib: number;
  private dragRib: number;

  constructor() {
    const container = document.getElementById("sideView");
    super({
      container: "sideView",
      width: container.offsetWidth,
      height: container.offsetHeight,
    });

    this.rib = 0;
    this.buffer = {};

    this.offsetX(- container.offsetWidth / 2);
    this.offsetY(- container.offsetHeight / 2);

    this.drawLayer = new Konva.Layer();
    this.add(this.drawLayer);

    const imageUrl =
      "https://upload.wikimedia.org/wikipedia/commons/" +
      "9/91/Plan_of_HMS_Surprise.jpg";
    this.background = new Scale(imageUrl);
    this.drawLayer.add(this.background);
    this.background.draw();

    this.cursor = new Konva.Line({
      stroke: "lightgrey",
      strokeWidth: 8,
      points: [],
    });
    this.cursor.visible(false);
    this.drawLayer.add(this.cursor);

    this.modifyRibs();

    CommandBuffer.pushCallback(this.callback.bind(this));
    UserInterfaceClickCallbacks.push(this.controlCallback.bind(this));

    this.on("mousedown", () => {
      // console.log("mousedown");
      const mousePos = this.getStage().getPointerPosition().x + this.offsetX();
      this.dragRib = mousePos;
      const closestRibToMouse = ComponentBuffer.closestRib(mousePos);

      if(closestRibToMouse.distance > 10) {
        this.sendCommandNewRib(mousePos);
      } else {
        this.sendCommandSelectRib(mousePos);
      }
    });
    this.on("mouseup", () => {
      // console.log("mouseup");
      this.dragRib = undefined;
    });
    this.on("contentMousemove", () => {
      const mousePos = this.getStage().getPointerPosition().x + this.offsetX();
      if(this.dragRib !== undefined) {
        this.sendCommandMoveRib(mousePos);
      }

      this.setCursor(mousePos);
      this.modifyRibs(mousePos);
    });
    this.on("contentMouseout", () => {
      // console.log("mouseout");
      this.cursor.visible(false);
      this.dragRib = undefined;
      this.draw();
    });
  }

  public controlCallback(key: string, value: any) {
    switch(key) {
      case "backgroundMove":
        if(value[0] === "lengthSection") {
          console.log(value);
          this.background.updateBackgroundImage({
            offsetX: value[1],
            offsetY: value[2],
            scaleX: value[3],
            scaleY: value[4],
          });
        }
        break;
      case "backgroundToggle":
        if(value[0] === "lengthSection") {
          console.log(value, this.background);
          this.background.backgroundImage.visible(value[1]);
          this.background.draw();
        }
        break;
      case "gridToggle":
        this.background.grid.visible(value[0]);
        this.draw();
        break;
    }
  }

  public callback(command: ICommand): void {
    if(command.action === "selectRib") {
      this.selectRib(command.rib);
    } else if(command.action === "newRib") {
      this.newRib(command.xa);
    } else if(command.action === "deleteRib") {
      ComponentBuffer.deleteRib();
      this.modifyRibs();
      this.draw();
    } else if(command.action === "moveRib") {
      this.moveRib(command.xb);
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
    component = new StaticLine(command);
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

  private modifyRibs(mousePosX?: number) {
    // console.log("modifyRibs(", mousePosX ,")", this.rib);
    for(const pos in this.buffer) {
      if(this.buffer.hasOwnProperty(pos)) {
        if(this.buffer[pos].rib !== undefined) {
          if(this.buffer[pos].rib.destroyChildren) {
            this.buffer[pos].rib.destroyChildren();
          }
          this.buffer[pos].rib.destroy();
          delete this.buffer[pos].rib;
        }
      }
    }
    let rib: number = null;
    let active: boolean = true;
    if(mousePosX !== undefined) {
      const closestRibToMouse = ComponentBuffer.closestRib(mousePosX);
      rib = closestRibToMouse.rib;
      active = closestRibToMouse.distance < 10;
    }
    for(const pos in ComponentBuffer.ribPositions) {
      if(ComponentBuffer.ribPositions.hasOwnProperty(pos)) {
        if(this.buffer[pos] === undefined) {
          this.buffer[pos] = {};
        }

        document.body.style.cursor = "default";
        if(active) {
          document.body.style.cursor = "pointer";
        }

        let stroke = "black";
        let strokeWidth = 2;
        if(rib === ComponentBuffer.ribPositions[pos] && active) {
          stroke = "orange";
        }
        if(this.rib === ComponentBuffer.ribPositions[pos]) {
          strokeWidth = 5;
          stroke = "orange";
        }
        this.buffer[pos].rib = new Konva.Line({
          points: [parseFloat(pos),
                   -this.height() / 2,
                   parseFloat(pos),
                   this.height() / 2],
          stroke,
          strokeWidth,
          // draggable: true,
        });
        this.drawLayer.add(this.buffer[pos].rib);
        this.buffer[pos].rib.moveToBottom();
        this.buffer[pos].rib.moveUp();
        this.buffer[pos].rib.moveUp();
      }
    }
  }

  private sendCommandNewRib(xPos: number) {
      const closestRibToMouse = ComponentBuffer.closestRib(xPos);
      const rib = closestRibToMouse.rib;
      console.assert(typeof rib === "number");

      const command: ICommand = {
        action: "newRib",
        name: "newRib",
        rib,
        time: Date.now(),
        xa: xPos,
      };
      CommandBuffer.push(command);
  }

  private newRib(xPos: number) {
    const rib = ComponentBuffer.newRib(xPos);
    console.assert(typeof rib === "number");
    this.sendCommandSelectRib(xPos, false);
  }

  private sendCommandSelectRib(xPos: number, store?: boolean) {
      const closestRibToMouse = ComponentBuffer.closestRib(xPos);
      const rib = closestRibToMouse.rib;
      console.assert(typeof rib === "number");

      const command: ICommand = {
        action: "selectRib",
        name: "selectRib",
        rib,
        time: Date.now(),
        xa: xPos,
      };
      if(store === undefined || store) {
        CommandBuffer.push(command);
      } else {
        CommandBuffer.execute(command);
      }
  }

  private selectRib(rib: number) {
    console.log("selectRib(", rib, ")");
    console.log(ComponentBuffer.ribPositions);
    this.rib = rib;
    console.assert(typeof this.rib === "number");
    this.modifyRibs();
    this.draw();
  }

  private sendCommandMoveRib(xPos: number) {
        const command: ICommand = {
          action: "moveRib",
          name: "moveRib",
          rib: this.rib,
          xa: this.dragRib,
          xb: xPos,
          time: Date.now(),
        };
        CommandBuffer.push(command);
  }

  private moveRib(posX: number) {
    console.log("moveRib(", posX, ")");
    const oldPosX = ComponentBuffer.positionRib[this.rib];
    ComponentBuffer.setRibPosition(posX, this.rib);
    for(const c in this.buffer[this.rib]) {
      if(this.buffer[this.rib].hasOwnProperty(c)) {
        const component = this.buffer[this.rib][c];
        component.x(component.x() + posX - oldPosX);
      }
    }
    this.modifyRibs();
    this.draw();
  }

  private setCursor(posX: number) {
    this.cursor.points([posX, -this.height() /2, posX, this.height() /2]);
    this.cursor.visible(true);
    this.draw();
  }
}

class BackgroundPicker {
  public element: HTMLDivElement;
  private image: HTMLDivElement;
  private stage: Konva.Stage;
  private content: BackgroundImage;
  private buttons: [HTMLDivElement];
  private gridVisible: boolean;

  constructor(width: number, height: number) {
    this.element = document.createElement("div");
    this.element.id = "BackgroundPickerElement";
    this.image = document.createElement("div");
    this.image.id = "BackgroundPickerImage";

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
        case "Length section":
          clone.addEventListener("click", this.toggleLengthSection.bind(this));
          break;
        case "View grid":
          clone.addEventListener("click", this.toggleViewGrid.bind(this));
          break;
      }
    }

    this.element.appendChild(this.image);

    this.content = new BackgroundImage(this.resizeCallback.bind(this));

    this.stage = new Konva.Stage({
      container: this.image,
      width: 800,  // Will resize when resizeCallback() is triggered.
      height: 800,
    });
    const layer = new Konva.Layer();

    layer.add(this.content);
    this.stage.add(layer);

    this.setButton("Cross section", this.content.viewCrossSection());
    this.setButton("Length section", this.content.viewLengthSection());
    this.gridVisible = true;
    this.setButton("View grid", this.gridVisible);
  }

  public resizeCallback(sectionName: string, posX: number, posY: number) {
    this.stage.width(this.content.width());
    this.stage.height(this.content.height());
    UserInterfaceClickCallbacks.forEach((callback) => {
      callback(
        "backgroundMove",
        [sectionName,
          posX,
          posY,
          this.content.image.scaleX(),
          this.content.image.scaleY(),
        ],
      );
    });
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
    UserInterfaceClickCallbacks.forEach((callback) => {
      callback("backgroundToggle",
               ["crossSection", this.content.viewCrossSection()]);
    });
  }

  private toggleLengthSection() {
    this.content.viewLengthSection(!this.content.viewLengthSection());
    this.setButton("Length section", this.content.viewLengthSection());
    UserInterfaceClickCallbacks.forEach((callback) => {
      callback("backgroundToggle",
               ["lengthSection", this.content.viewLengthSection()]);
    });
  }

  private toggleViewGrid() {
    this.gridVisible = !this.gridVisible;
    this.setButton("View grid", this.gridVisible);
    UserInterfaceClickCallbacks.forEach((callback) => {
      callback("gridToggle",
               [this.gridVisible]);
    });
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
