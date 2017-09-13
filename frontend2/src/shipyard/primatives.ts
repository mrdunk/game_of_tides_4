// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import {CommandBuffer, ICommand} from "./command_buffer";
import {ComponentBuffer, IComponent} from "./component_buffer";

const snapDistance = 10;
const gridSize = 50;
const defaultNewLinePos = [20, 20, 20, 120];
const defaultNewLinePos2 = [-defaultNewLinePos[0],
                            defaultNewLinePos[1],
                            -defaultNewLinePos[2],
                            defaultNewLinePos[3]];

export class ControlPanel extends Konva.Group {
  private usedWidth: number = 0;
  private buttons: [Konva.Node] = [] as [Konva.Node];
  private readonly padding: number = 5;
  constructor() {
    super();
  }

  public draw(): Konva.Node {
    this.buttons.forEach((button) => {
      button.draw();
    });
    return super.draw();
  }

  public addButton(name: string, callback: (buttonName: string)=>void, color) {
    const button = new Button(name, callback, color);
    button.x(this.usedWidth + button.width() / 2);
    button.y(button.height() / 2);
    this.buttons.push(button);
    this.usedWidth += button.width() + this.padding;

    this.add(button);
  }

  public addText(parentObject, variable: string, color) {
    const text = new TextDisplay(parentObject, variable, color);
    text.x(this.usedWidth + text.width() / 2);
    text.y(text.height() / 2);
    this.buttons.push(text);
    this.usedWidth += text.width() + this.padding;

    this.add(text);
  }
}

class Button extends Konva.Rect {
  constructor(private nameP: string,
              private callback: (buttonName: string) => void,
              private color) {
    super({
      width: 60,
      height: 30,
      stroke: "black",
      strokeWidth: 2,
      fill: color,
      draggable: false,
    });

    this.name(nameP);

    this.on("click", () => {
      console.log("Button.mouseclick");
      this.callback(this.name());
    });
    this.on("mouseover", () => {
      this.stroke("darkgrey");
      this.strokeWidth(5);
      this.draw();
      document.body.style.cursor = "pointer";
    });
    this.on("mouseout", () => {
      this.stroke("white");
      this.draw();
      this.stroke("black");
      this.strokeWidth(2);
      this.draw();
      document.body.style.cursor = "default";
    });
  }
}

class TextDisplay extends Konva.Group {
  private text: Konva.Text;
  private background: Konva.Rect;

  constructor(private parentObject, private variable, private color) {
    super();
    this.width(60);
    this.height(30);
    this.text = new Konva.Text({
      width: 60,
      height: 30,
      text: "rib: " + parentObject[variable](),
      fontSize: 16,
      fontFamily: "Calibri",
      fill: "black",
      align: "center",
      padding: 5,
    });
    this.background = new Konva.Rect({
      width: 60,
      height: 30,
      stroke: "black",
      strokeWidth: 2,
      fill: color,
      draggable: false,
    });

    this.add(this.background);
    this.add(this.text);
  }

  public draw(): Konva.Node {
    this.text.text("rib: " + this.parentObject[this.variable]());
    return super.draw();
  }
}

class MovableLineCap extends Konva.Circle {
  constructor(private capNo: number, private line: MovableLine) {
    super({
      radius: 6,
      stroke: "black",
      strokeWidth: 2,
      fill: "lightblue",
      draggable: true,
    });

    let name = this.line.name();
    name += (this.capNo > 0) ? "_a" : "_b";
    name += (this.capNo > 1) ? "" : "2";
    this.name(name);

    this.on("mouseover", () => {
      this.line.highlight(true);
      this.fill("red");
      this.draw();
      document.body.style.cursor = "pointer";
    });
    this.on("mouseout", () => {
      this.line.highlight(false);
      document.body.style.cursor = "default";
    });
    this.on("dragstart", () => {
      console.log(this.name());
      this.fill("yellow");
      this.draw();
      this.line.moving(true);
    });
    this.on("dragend", () => {
      this.fill("lightblue");
      this.draw();
      this.line.movedCap(capNo);
      this.line.moving(false);
    });
    this.on("dragmove", () => {
      this.fill("yellow");
      this.draw();
      this.line.movedCap(capNo);
    });
  }
}

class MovableLineLine extends Konva.Line {
  constructor(private line: MovableLine) {
    super({
      points: [],
      stroke: "black",
      strokeWidth: 5,
      draggable: false,
    });

    this.name(line.name());

    this.on("mouseover", () => {
      this.line.highlight(true);
    });
    this.on("mouseout", () => {
      this.line.highlight(false);
    });
  }

}

export class MovableLine extends Konva.Group {
  public static makeName(): string {
    const returnValue = "line_" + MovableLine.counter;
    MovableLine.counter++;
    return returnValue;
  }

  private static counter: number = 0;
  public a: MovableLineCap;
  public b: MovableLineCap;
  public line: MovableLineLine;
  public a2: MovableLineCap;
  public b2: MovableLineCap;
  public line2: MovableLineLine;
  public mirrored: boolean;

  constructor(private rib: number,
              private overideName?: string,
              private options?: [string]) {
    super();
    console.log("MovableLine(", rib, overideName, options, ")",
                CommandBuffer.buffer);
    if(overideName) {
      this.name(overideName);
    } else {
      this.name(MovableLine.makeName());
    }

    this.mirrored = options && options.indexOf("mirror") >= 0;

    this.line = new MovableLineLine(this);
    this.a = new MovableLineCap(0, this);
    this.b = new MovableLineCap(1, this);
    this.line.points(defaultNewLinePos.slice());
    this.a.x(this.line.points()[0]);
    this.a.y(this.line.points()[1]);
    this.b.x(this.line.points()[2]);
    this.b.y(this.line.points()[3]);
    this.add(this.line);
    this.add(this.a);
    this.add(this.b);

    if(this.mirrored) {
      this.line2 = new MovableLineLine(this);
      this.a2 = new MovableLineCap(2, this);
      this.b2 = new MovableLineCap(3, this);
      this.syncroniseMirroring();
      this.add(this.line2);
      this.add(this.a2);
      this.add(this.b2);
    }
  }

  public destroy() {
    ComponentBuffer.remove(this.rib, this.name());
    return super.destroy();
  }

  public movedCap(capNo: number) {
    this.snap();
    this.storeAction("lineMove", capNo);
  }

  public getPoints() {
    return [[this.a.x(), this.a.y()], [this.b.x(), this.b.y()]];
  }

  public setPosition(command: ICommand) {
    if(command.xa === undefined || command.ya === undefined ||
       command.xb === undefined || command.yb === undefined) {
      this.a.x(defaultNewLinePos[0]);
      this.a.y(defaultNewLinePos[1]);
      this.b.x(defaultNewLinePos[2]);
      this.b.y(defaultNewLinePos[3]);
    } else {
      this.a.x(command.xa);
      this.a.y(command.ya);
      this.b.x(command.xb);
      this.b.y(command.yb);
    }

    const points = this.line.points();
    points[0] = this.a.x();
    points[1] = this.a.y();
    points[2] = this.b.x();
    points[3] = this.b.y();

    this.syncroniseMirroring();

    this.draw();

    this.storeComponent();
  }

  public highlight(state: boolean) {
    this.line.moveToBottom();
    if(state) {
      this.line.stroke("darkorange");
      this.a.fill("darkorange");
      this.b.fill("darkorange");
      this.line.draw();
      this.a.draw();
      this.b.draw();
      return;
    }

    this.line.stroke("black");
    this.a.fill("lightblue");
    this.b.fill("lightblue");
    this.line.draw();
    this.a.draw();
    this.b.draw();
  }

  public moving(state: boolean) {
    this.line.moveToBottom();
    if(state) {
      this.line.dash([10, 5]);
      this.line.draw();
      this.a.draw();
      this.b.draw();
      return;
    }

    this.line.dash([]);
    this.line.draw();
    this.a.draw();
    this.b.draw();
  }

  private snap() {
    this.a.x(snapDistance * Math.round(this.a.x() / snapDistance));
    this.a.y(snapDistance * Math.round(this.a.y() / snapDistance));
    this.b.x(snapDistance * Math.round(this.b.x() / snapDistance));
    this.b.y(snapDistance * Math.round(this.b.y() / snapDistance));

    for(const key in ComponentBuffer.buffer[this.rib]) {
      if(!ComponentBuffer.buffer[this.rib].hasOwnProperty(key)) {
        continue;
      }
      const component = ComponentBuffer.buffer[this.rib][key];
      if(component.name === this.name()) {
        continue;
      } else if(Math.abs(component.xa - this.a.x()) +
                 Math.abs(component.ya - this.a.y()) < snapDistance *2) {
        this.a.x(component.xa);
        this.a.y(component.ya);
        break;
      } else if(Math.abs(component.xb - this.a.x()) +
                Math.abs(component.yb - this.a.y()) < snapDistance *2) {
        this.a.x(component.xb);
        this.a.y(component.yb);
        break;
      } else if(Math.abs(component.xa - this.b.x()) +
                Math.abs(component.ya - this.b.y()) < snapDistance *2) {
        this.b.x(component.xa);
        this.b.y(component.ya);
        break;
      } else if(Math.abs(component.xb - this.b.x()) +
                Math.abs(component.yb - this.b.y()) < snapDistance *2) {
        this.b.x(component.xb);
        this.b.y(component.yb);
        break;
      }
    }
  }

  private syncroniseMirroring() {
    if(!this.mirrored) {
      return;
    }
    this.a2.x(-this.a.x());
    this.a2.y(this.a.y());
    this.b2.x(-this.b.x());
    this.b2.y(this.b.y());
    const points = this.line.points().slice();
    points[0] = -points[0];
    points[2] = -points[2];
    this.line2.points(points);
  }

  /* Saves command to buffer and call callbacks which are interested in command.
   * This class is one of those callbacks so a command originating in this
   * class still has to go through this method. */
  private storeAction(actionType: string, capNo: number) {
    let xa = this.a.x();
    let xb = this.b.x();
    if(capNo > 1) {
      xa = -this.a.x();
      xb = -this.b.x();
    }

    const command: ICommand = {
      action: actionType,
      name: this.name(),
      rib: this.rib,
      time: Date.now(),
      xa,
      ya: this.a.y(),
      xb,
      yb: this.b.y(),
    };
    CommandBuffer.push(command);
  }

  private storeComponent() {
    const component: IComponent = {
      name: this.name(),
      rib: this.rib,
      xa: this.a.x(),
      ya: this.a.y(),
      xb: this.b.x(),
      yb: this.b.y(),
    };
    ComponentBuffer.push(component);
  }
}

export class StaticLine extends Konva.Group {
  constructor(private component: IComponent) {
    super();
    this.name(component.name);

    let ya = component.ya;
    let yb = component.yb;
    if(component.xa === undefined || component.ya === undefined ||
       component.xb === undefined || component.yb === undefined) {
      // This is probably a lineNew.
      ya = defaultNewLinePos[1];
      yb = defaultNewLinePos[3];
    }

    const ribXPos = component.rib * gridSize;
    const line = new Konva.Line({
      points: [ribXPos, ya, ribXPos, yb],
      stroke: "black",
      strokeWidth: 5,
    });
    this.add(line);

    const capA = new Konva.Circle({
      x: ribXPos,
      y: ya,
      stroke: "black",
      strokeWidth: 1,
      radius: 3,
      fill: "red",
    });
    this.add(capA);

    const capB = new Konva.Circle({
      x: ribXPos,
      y: yb,
      stroke: "black",
      strokeWidth: 1,
      radius: 3,
      fill: "red",
    });
    this.add(capB);
  }
}

export class Scale extends Konva.Group {
  constructor() {
    super();
    this.listening(false);
  }

  public draw(): Konva.Node {
    this.destroyChildren();

    const stage = this.getStage();
    this.width(stage.width());
    this.height(stage.height());

    const water = new Konva.Rect({
      width: this.width(),
      height: this.height() / 2,
      y: 0,
      x: - this.width() / 2,
      fill: "#88C0CA",
    });
    this.add(water);

    const sky = new Konva.Rect({
      width: this.width(),
      height: this.height() / 2,
      y: - this.height() / 2,
      x: - this.width() / 2,
      fill: "#C4E0E5",
    });
    this.add(sky);

    const xStart = -Math.round(this.width() / 2 / gridSize) * gridSize;
    const YStart = -Math.round(this.height() / 2 / gridSize) * gridSize;
    for(let x = xStart; x < this.width() / 2; x += gridSize) {
      const vertical = new Konva.Line({
        points: [x, - this.height() / 2, x, this.height() / 2],
        stroke: "darkGrey",
      });
      this.add(vertical);
    }
    for(let y = YStart; y < this.height() / 2; y += gridSize) {
      const horizontal = new Konva.Line({
        points: [- this.width() / 2, y, this.width() / 2, y],
        stroke: "darkGrey",
      });
      this.add(horizontal);
    }

    this.moveToBottom();
    const centre = new Konva.Circle({
      radius: 10,
      stroke: "black",
      strokeWidth: 2,
    });
    this.add(centre);

    return this;
  }
}

