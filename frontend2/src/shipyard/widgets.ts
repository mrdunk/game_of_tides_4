// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import {CommandBuffer, ICommand} from "./command_buffer";
import {ComponentBuffer} from "./component_buffer";
import {ControlPanel, Line, Scale} from "./primatives";

export class CrossSection extends Konva.Stage {
  constructor() {
    const container = document.getElementById("crossSection");
    super({
      container: "crossSection",
      width: container.offsetWidth,
      height: container.offsetHeight,
    });

    const drawLayer = new Konva.Layer();
    drawLayer.offsetX(- container.offsetWidth / 2);
    drawLayer.offsetY(- container.offsetHeight / 2);
    this.add(drawLayer);

    const scale = new Scale();
    drawLayer.add(scale);
    scale.draw();

    const controlLayer = new Konva.Layer();
    this.add(controlLayer);
    const pannel = new ControlPanel();
    pannel.addButton("test", (buttonName) => {
      drawLayer.add(new Line(1));
      drawLayer.draw();
    }, "red");
    pannel.addButton("test2", (buttonName) => {
      console.log(CommandBuffer.summary());
      console.log(ComponentBuffer.show());
    }, "green");
    pannel.addButton("test3", (buttonName) => {
      CommandBuffer.undo([drawLayer]);
    }, "yellow");
    pannel.addButton("test4", (buttonName) => {
      CommandBuffer.redo([drawLayer]);
    }, "yellow");
    controlLayer.add(pannel);

    drawLayer.draw();
    controlLayer.draw();
  }
}

export class SideView extends Konva.Stage {
  private cursor: Konva.Line;
  private background: Scale;
  private static snapDistance: number = 50;

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
      console.log("SideView.click");
    });
    this.on("contentMousemove", () => {
      const mousePos = this.getStage().getPointerPosition();
      this.setCursor(mousePos.x + this.offsetX(), mousePos.y + this.offsetY());
    });
  }

  private setCursor(posX, posY) {
    posX = Math.round(posX / SideView.snapDistance) * SideView.snapDistance;
    this.cursor.points([posX, -this.height() /2, posX, this.height() /2]);
    this.cursor.visible(true);
    this.background.getLayer().draw();
    this.cursor.draw();
  }
}

