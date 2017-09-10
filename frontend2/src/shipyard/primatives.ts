// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import {CommandBuffer, ICommand} from "./command_buffer";

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

class LineEnd extends Konva.Circle {
  constructor(private end: number, private line: Line) {
    super({
      radius: 10,
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
    this.line.movedEnd(this.end, this.x(), this.y());
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
    if(state) {
      this.dash([10, 5]);
      this.moveToBottom();
      this.draw();
      return;
    }

    this.dash([]);
    this.moveToBottom();
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
  public a: LineEnd;
  public b: LineEnd;
  public line: LineLine;

  constructor() {
    super();
    this.name("line_" + Line.counter);
    Line.counter++;

    this.line = new LineLine(this);
    this.a = new LineEnd(0, this);
    this.b = new LineEnd(1, this);
    this.line.points([20, 20, 20, 120]);
    this.a.x(20);
    this.a.y(20);
    this.b.x(20);
    this.b.y(120);
    this.add(this.line);
    this.add(this.a);
    this.add(this.b);
    this.line.moveToBottom();

    this.store("lineNew");
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

    this.store("lineMove");
  }

  public movedEnd(end: number, dx: number, dy: number) {
    const points = this.line.points();
    points[2 * end] = dx;
    points[2 * end +1] = dy;

    this.store("lineMove");
  }

  public getPoints() {
    return [[this.a.x(), this.a.y()], [this.b.x(), this.b.y()]];
  }

  public setPosition(command: ICommand) {
    console.log(this.a.x(), command.xa);
    this.a.x(command.xa);
    this.a.y(command.ya);
    this.b.x(command.xb);
    this.b.y(command.yb);

    const points = this.line.points();
    points[0] = this.a.x();
    points[1] = this.a.y();
    points[2] = this.b.x();
    points[3] = this.b.y();
  }

  private store(actionType: string) {
    const command: ICommand = {
      action: actionType,
      name: this.name(),
      time: Date.now(),
      xa: this.a.x(),
      ya: this.a.y(),
      za: 0,
      xb: this.b.x(),
      yb: this.b.y(),
      zb: 0,
    };
    CommandBuffer.push(command);
  }
}

