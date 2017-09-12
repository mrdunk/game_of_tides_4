// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import {CommandBuffer, ICommand} from "./command_buffer";
import {ComponentBuffer} from "./component_buffer";
import {ControlPanel, Line, Scale} from "./primatives";

export class CrossSection extends Konva.Stage {
  private ribValue: number;
  private controlPannel: ControlPanel;

  constructor() {
    const container = document.getElementById("crossSection");
    super({
      container: "crossSection",
      width: container.offsetWidth,
      height: container.offsetHeight,
    });

    this.rib(0);

    const drawLayer = new Konva.Layer();
    drawLayer.offsetX(- container.offsetWidth / 2);
    drawLayer.offsetY(- container.offsetHeight / 2);
    this.add(drawLayer);

    const scale = new Scale();
    drawLayer.add(scale);
    scale.draw();

    const controlLayer = new Konva.Layer();
    this.add(controlLayer);
    this.controlPannel = new ControlPanel();
    this.controlPannel.addButton("test", (buttonName) => {
      drawLayer.add(new Line(1));
      drawLayer.draw();
    }, "red");
    this.controlPannel.addButton("test2", (buttonName) => {
      console.log(CommandBuffer.summary());
      console.log(ComponentBuffer.show());
    }, "green");
    this.controlPannel.addButton("test3", (buttonName) => {
      CommandBuffer.undo([drawLayer]);
    }, "yellow");
    this.controlPannel.addButton("test4", (buttonName) => {
      CommandBuffer.redo([drawLayer]);
    }, "yellow");
    this.controlPannel.addText(this, "rib", "lightgreen");
    controlLayer.add(this.controlPannel);

    drawLayer.draw();
    controlLayer.draw();

    CommandBuffer.pushCallback(this.callback.bind(this));
  }

  public callback(command: ICommand): void {
    if(command.action === "changeRib") {
      this.rib(command.rib);
      this.controlPannel.draw();
    }
  }

  private rib(rib: number) {
    if(rib === undefined) {
      console.log("rib (get): ", this.ribValue);
      return this.ribValue;
    }
    console.log("rib (set): ", rib);
    this.ribValue = rib;
  }
}

export class SideView extends Konva.Stage {
  private static snapDistance: number = 50;
  private cursor: Konva.Line;
  private background: Scale;

  constructor() {
    const container = document.getElementById("sideView");
    super({
      container: "sideView",
      width: container.offsetWidth,
      height: container.offsetHeight,
    });

    this.offsetX(- container.offsetWidth / 2);
    this.offsetY(- container.offsetHeight / 2);

    const drawLayer = new Konva.Layer();
    // drawLayer.offsetX(- container.offsetWidth / 2);
    // drawLayer.offsetY(- container.offsetHeight / 2);
    this.add(drawLayer);

    this.background = new Scale();
    drawLayer.add(this.background);
    this.background.draw();

    drawLayer.draw();

    this.cursor = new Konva.Line({
      stroke: "lightgrey",
      strokeWidth: 8,
      points: [],
    });
    this.cursor.visible(false);
    drawLayer.add(this.cursor);

    this.on("contentClick", () => {
      const mousePos = this.getStage().getPointerPosition();
      this.setRib(mousePos.x + this.offsetX());
    });
    this.on("contentMousemove", () => {
      const mousePos = this.getStage().getPointerPosition();
      this.setCursor(mousePos.x + this.offsetX(), mousePos.y + this.offsetY());
    });
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
  }

  private setCursor(posX, posY) {
    posX = Math.round(posX / SideView.snapDistance) * SideView.snapDistance;
    this.cursor.points([posX, -this.height() /2, posX, this.height() /2]);
    this.cursor.visible(true);
    this.background.getLayer().draw();
    this.cursor.draw();
  }
}

