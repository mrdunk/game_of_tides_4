class WidgetBase {
  public element: HTMLElement;

  constructor(public label: string,
              public width: number,
              public height: number) {
    this.element = document.getElementById(label);
    if(!this.element) {
      this.element = document.createElement("div");
    }
    this.element.className = "widget";

    this.element.style.width = "" + width + "px";
    this.element.style.height = "" + height + "px";
  }
}

class StatusWidget extends WidgetBase {
  private graph: HTMLElement;
  private message: HTMLElement;

  constructor() {
    super("FPS", 100, 50);
    setInterval(this.service.bind(this), 1000);

    this.graph = document.createElement("div");
    this.graph.className = "graph";

    this.message = document.createElement("div");
    this.message.className = "message";

    this.element.appendChild(this.graph);
    this.element.appendChild(this.message);
  }

  public service() {
    this.message.innerHTML = "FPS: " + Math.round(MainLoop.FPS);

    const bar = document.createElement("div");
    bar.className = "bar";
    if(Date.now() - MainLoop.lastDrawFrame <= 1000) {
      const height = this.height * MainLoop.FPS / maxFps;
      bar.style.background = "cadetblue";
      bar.style.height = "" + Math.round(height) + "px";
    }

    this.graph.appendChild(bar);
    while(this.graph.childElementCount > this.width) {
      this.graph.removeChild(this.graph.firstChild);
    }
  }
}

class LatLonWidget extends WidgetBase {
  constructor(private camera: Camera) {
    super("FPS", 150, 50);
    setInterval(this.service.bind(this), 20);
  }

  public service() {
    this.element.innerHTML =
      "lat: " + this.camera.lat +
      "\xB0&nbsp;&nbsp;&nbsp;lon: " + this.camera.lon +
      "\xB0<br/>" + Math.round(this.camera.position.x * 100) / 100 +
      ", " + Math.round(this.camera.position.y * 100) / 100 +
      ", " + Math.round(this.camera.position.z * 100) / 100;
  }
}

