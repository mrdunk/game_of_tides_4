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

export class Controls extends Konva.Stage {
  private drawLayer: Konva.Layer;

  constructor(private callbacks: [(key: string, value: any) => void]) {
    super({
      container: "crossSectionControls",
      width: 100,
      height: 100,
    });
    const container = document.getElementById("crossSectionControls");
    this.width(container.offsetWidth);
    this.height(container.offsetHeight);

    this.drawLayer = new Konva.Layer();
    this.add(this.drawLayer);

    const controlLayer = new Konva.Layer();
    this.add(controlLayer);

    const button = new Button2("b", this.callbacks, "red", "unused");
    button.x(5);
    button.y(5);
    controlLayer.add(button);
    controlLayer.draw();
  }
}


export class CrossSection extends Konva.Stage {
  private ribValue: number;
  private controlPannel: ControlPanel;
  private drawLayer: Konva.Layer;
  private buffer: ICrossSectionBuffer;

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
    this.controlPannel.addButton("lineNew", (buttonName) => {
      const command: ICommand = {
        action: "lineNew",
        name: MovableLine.makeName(),
        rib: this.rib(),
        time: Date.now(),
      };
      CommandBuffer.push(command);
    }, "red");
    this.controlPannel.addButton("lineNewMirror", (buttonName) => {
      const command: ICommand = {
        action: "lineNew",
        name: MovableLine.makeName(),
        rib: this.rib(),
        time: Date.now(),
        options: ["mirror"],
      };
      CommandBuffer.push(command);
    }, "red");
    this.controlPannel.addButton("test3", (buttonName) => {
      CommandBuffer.undo();
    }, "yellow");
    this.controlPannel.addButton("test4", (buttonName) => {
      CommandBuffer.redo();
    }, "yellow");
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
  }

  public controlCallback(key: string, value: any) {
    console.log("controlCallback(key: ", key, ", value: ", value, ")");
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

  private addLine(rib: number, name?: string, options?: [string]) {
    console.log(rib, name);
    if(rib === undefined) {
      rib = this.rib();
    }
    const newLine =
      new MovableLine(rib, this.buffer[this.rib()], name, options);
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
    if(command.action === "lineNew" || command.action === "lineMove" ) {
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

