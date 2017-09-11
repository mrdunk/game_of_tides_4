// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import {CommandBuffer, ICommand} from "./command_buffer";
import {ComponentBuffer, IComponent} from "./component_buffer";

const snapDistance = 10;

export class ControlPanel extends Konva.Group {
  private usedWidth: number = 0;
  private buttons: [Button] = [] as [Button];
  private readonly padding: number = 5;
  constructor() {
    super();
  }

  public addButton(name: string, callback: (buttonName: string)=>void, color) {
    const button = new Button(name, callback, color);
    button.x(this.usedWidth + button.width() / 2);
    button.y(button.height() / 2);
    this.buttons.push(button);
    this.usedWidth += button.width() + this.padding;

    this.add(button);
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

class LineCap extends Konva.Circle {
  constructor(private end: number, private line: Line) {
    super({
      radius: 6,
      stroke: "black",
      strokeWidth: 2,
      fill: "lightblue",
      draggable: true,
    });

    let name = this.line.name();
    name += (this.end > 0) ? "_a" : "_b";
    this.name(name);

    this.on("mouseover", () => {
      this.fill("red");
      this.draw();
      document.body.style.cursor = "pointer";
    });
    this.on("mouseout", () => {
      this.fill("lightblue");
      this.draw();
      document.body.style.cursor = "default";
    });
    this.on("dragstart", () => {
      console.log(this.name());
      this.fill("yellow");
      this.draw();
      this.line.line.moving(true);
    });
    this.on("dragend", () => {
      this.fill("lightblue");
      this.draw();
      this.updateLine();
      this.line.line.moving(false);
    });
    this.on("dragmove", () => {
      this.fill("yellow");
      this.draw();
      this.updateLine();
    });
  }

  private updateLine() {
    this.line.movedEnd();
  }
}

class LineLine extends Konva.Line {
  private lastX: number = 0;
  private lastY: number = 0;

  constructor(private line: Line) {
    super({
      points: [],
      stroke: "black",
      strokeWidth: 5,
      draggable: true,
    });

    this.name(line.name());

    this.on("mouseover", () => {
      document.body.style.cursor = "pointer";
      this.stroke("darkorange");
      this.moveToBottom();
      this.draw();
    });
    this.on("mouseout", () => {
      document.body.style.cursor = "default";
      this.stroke("black");
      this.moveToBottom();
      this.draw();
    });
    this.on("dragstart", () => {
      console.log(this.name());
      this.stroke("yellow");
      this.setLastPosition();
      this.moving(true);
    });
    this.on("dragend", () => {
      this.stroke("black");
      this.moving(false);
    });
    this.on("dragmove", (event) => {
      this.stroke("darkorange");
      this.draw();

      this.updateLine();
    });
  }

  public moving(state: boolean) {
    this.moveToBottom();
    if(state) {
      this.dash([10, 5]);
      this.draw();
      return;
    }

    this.dash([]);
    this.draw();
  }

  private setLastPosition() {
    this.lastX = this.getAbsolutePosition().x;
    this.lastY = this.getAbsolutePosition().y;
  }

  private updateLine() {
    this.line.moved(this.getAbsolutePosition().x - this.lastX,
                    this.getAbsolutePosition().y - this.lastY);

    this.setLastPosition();

    this.x(0);
    this.y(0);

    this.moveToBottom();
    this.draw();
  }
}

export class Line extends Konva.Group {
  private static counter: number = 0;
  public a: LineCap;
  public b: LineCap;
  public line: LineLine;

  constructor(private rib: number, private overideName?: string) {
    super();
    if(overideName) {
      this.name(overideName);
    } else {
      this.name("line_" + Line.counter);
      Line.counter++;
    }

    this.line = new LineLine(this);
    this.a = new LineCap(0, this);
    this.b = new LineCap(1, this);
    this.line.points([20, 20, 20, 120]);
    this.a.x(20);
    this.a.y(20);
    this.b.x(20);
    this.b.y(120);
    this.add(this.line);
    this.add(this.a);
    this.add(this.b);
    this.line.moveToBottom();

    if(!overideName) {
      this.storeAction("lineNew");
    }
  }

  public destroy() {
    ComponentBuffer.remove(this.rib, this.name());
    return super.destroy();
  }

  public moved(dx: number, dy: number) {
    this.a.x(this.a.x() + dx);
    this.a.y(this.a.y() + dy);
    this.b.x(this.b.x() + dx);
    this.b.y(this.b.y() + dy);

    const points = this.line.points();
    points[0] = this.a.x();
    points[1] = this.a.y();
    points[2] = this.b.x();
    points[3] = this.b.y();

    this.storeAction("lineMove");
  }

  public movedEnd() {
    this.snap();
    const points = this.line.points();
    points[0] = this.a.x();
    points[1] = this.a.y();
    points[2] = this.b.x();
    points[3] = this.b.y();
    this.storeAction("lineMove");
  }

  public getPoints() {
    return [[this.a.x(), this.a.y()], [this.b.x(), this.b.y()]];
  }

  public setPosition(command: ICommand) {
    this.a.x(command.xa);
    this.a.y(command.ya);
    this.b.x(command.xb);
    this.b.y(command.yb);

    const points = this.line.points();
    points[0] = this.a.x();
    points[1] = this.a.y();
    points[2] = this.b.x();
    points[3] = this.b.y();

    this.storeComponent();
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

  private storeAction(actionType: string) {
    const command: ICommand = {
      action: actionType,
      name: this.name(),
      rib: this.rib,
      time: Date.now(),
      xa: this.a.x(),
      ya: this.a.y(),
      xb: this.b.x(),
      yb: this.b.y(),
    };
    CommandBuffer.push(command);

    this.storeComponent();
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

    const gridSize = 50;
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

