import * as Konva from "konva";

console.log("shipyard.ts");

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
    });
    this.on("dragend", () => {
      this.fill("lightblue");
      this.draw();
      this.updateLine();
    });
    this.on("dragmove", () => {
      console.log(this.name());
      this.fill("yellow");
      this.draw();
      this.updateLine();
    });
  }

  private updateLine() {
    this.line.moved(this.end, this.x(), this.y());
  }
}

class Line extends Konva.Group {
  private static counter: number = 0;
  private a: Konva.Circle;
  private b: Konva.Circle;
  private line: Konva.Line;

  constructor() {
    super();
    this.name("line_" + Line.counter);
    Line.counter++;

    this.a = new LineEnd(0, this);
    this.b = new LineEnd(1, this);
    this.line = new Konva.Line({
      points: [20, 20, 20, 120],
      stroke: "black",
      strokeWidth: 2,
    });
    this.a.x(20);
    this.a.y(20);
    this.b.x(20);
    this.b.y(120);
    this.add(this.a);
    this.add(this.b);
    this.add(this.line);

  }

  public moved(end: number, dx: number, dy: number) {
    console.log(end, dx, dy);
    const points = this.line.points();
    points[2 * end] = dx;
    points[2 * end +1] = dy;
    this.line.points(points);
  }
}

window.onload = () => {

  const stage = new Konva.Stage({
    container: "shipyard",
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // add canvas element
  const layer = new Konva.Layer();
  stage.add(layer);

  const line = new Line();
  layer.add(line);

  // create shape
  const box = new Konva.Rect({
    x: 50,
    y: 50,
    width: 100,
    height: 50,
    fill: "#00D2FF",
    stroke: "black",
    strokeWidth: 4,
    draggable: true,
  });
  layer.add(box);

  layer.draw();

  // add cursor styling
  box.on("mouseover", () => {
    document.body.style.cursor = "pointer";
  });
  box.on("mouseout", () => {
    document.body.style.cursor = "default";
  });

};
