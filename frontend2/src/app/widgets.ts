class WidgetBase {
  public element: HTMLElement;

  constructor(public label: string,
              public width: number,
              public height: number,
              public posVert: string,
              public posHor: string,
              public childOf?: string ) {
    let parentElement = document.body;
    if(childOf) {
      parentElement = document.getElementById(childOf);
    }

    this.element = document.getElementById(label);
    if(!this.element) {
      this.element = document.createElement("div");
      parentElement.appendChild(this.element);
    }

    this.element.style.background = "aliceblue";
    this.element.style.width = "" + width + "px";
    this.element.style.height = "" + height + "px";
    this.element.style.position = "absolute";
    this.element.style[posVert] = "0px";
    this.element.style[posHor] = "0px";
    this.element.style.margin = "14px 14px";
    this.element.style.padding = "14px 14px";
    this.element.style["border-radius"] = "5px";
  }
}

class StatusWidget extends WidgetBase {
  private graph: HTMLElement;
  private message: HTMLElement;

  constructor(public posVert: string, public posHor: string) {
    super("FPS", 100, 50, posVert, posHor);
    setInterval(this.service.bind(this), 1000);
    
    this.graph = document.createElement("div");
    this.graph.style.position = "absolute";

    this.message = document.createElement("div");
    this.message.style.position = "absolute";
    this.message.style.display = "flex";
    this.message.style["align-items"] = "center";
    this.message.style["justify-content"] = "center";
    this.message.style.width = "" + this.width + "px";
    this.message.style.height = "" + this.height + "px";


    this.element.appendChild(this.graph);
    this.element.appendChild(this.message);
  }

  public service() {
    this.message.innerHTML = "FPS: " + Math.round(MainLoop.FPS);

    const bar = document.createElement("div");
    bar.style.width = "1px";
    bar.style.display = "inline-block";
    bar.style.background = "red";
    bar.style.height = "4px";
    if(Date.now() - MainLoop.lastDrawFrame <= 1000) {
      bar.style.background = "cadetblue";
      bar.style.height = "" + Math.round(MainLoop.FPS) + "px";
    }

    this.graph.appendChild(bar);
    while(this.graph.childElementCount > this.width) {
      this.graph.removeChild(this.graph.firstChild);
    }
  }
}
