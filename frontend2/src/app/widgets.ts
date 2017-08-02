class WidgetBase {
  public element: HTMLElement;

  constructor(public label: string,
              public width: number,
              public height: number) {
    this.element = document.getElementById(label);
    if(!this.element) {
      this.element = document.createElement("div");
    }
    this.element.classList.add("widget");

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
    this.graph.classList.add("graph");

    this.message = document.createElement("div");
    this.message.classList.add("message");

    this.element.appendChild(this.graph);
    this.element.appendChild(this.message);

    this.element.classList.add("centered");
  }

  public service() {
    this.message.innerHTML = "FPS: " + Math.round(MainLoop.FPS);


    const bar = document.createElement("div");
    bar.classList.add("bar");
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

class CameraPositionWidget extends WidgetBase {
  constructor(private camera: Camera) {
    super("CameraPos", 180, 50);
    setInterval(this.service.bind(this), 20);
    this.element.classList.add("centered");
  }

  public service() {
    const pitch = Math.round(THREE.Math.radToDeg(this.camera.pitch)) -90;
    const pitchString = "" + pitch + "\xB0";

    const yaw = Math.round(THREE.Math.radToDeg(this.camera.yaw));
    let yawString = "0\xB0";
    if(yaw < 0) {
      yawString = "" + (0 - yaw) + "\xB0E";
    } else if(yaw > 0) {
      yawString = "" + yaw + "\xB0W";
    }

    this.element.innerHTML =
      "lat: " + this.camera.lat +
      "\xB0&nbsp;&nbsp;&nbsp;lon: " + this.camera.lon + "\xB0<br/>" +
      "pitch: " + pitchString + "&nbsp;&nbsp;&nbsp;yaw: " + yawString;
  }
}

class MenuWidget extends WidgetBase {
  public userInput: Array<KeyboardEvent | ICustomInputEvent> = [];
  private uiMenu = new UIMenu();

  constructor(public label: string) {
    super("Menu", 100, 200);
    setInterval(this.service.bind(this), 1000);

    UIMaster.clientMessageQueues.push(this.userInput);

    const content = {
      worldLevel0: {
        label: "0",
        type: "checkbox",
        key: "0",
      },
      worldLevel1: {
        label: "1",
        type: "checkbox",
        key: "1",
      },
      worldLevel2: {
        label: "2",
        type: "checkbox",
        key: "2",
      },
      worldLevel3: {
        label: "3",
        type: "checkbox",
        key: "3",
      },
      worldLevel4: {
        label: "4",
        type: "checkbox",
        key: "4",
      },
      worldLevel5: {
        label: "5",
        type: "checkbox",
        key: "5",
      },
      worldLevel6: {
        label: "6",
        type: "checkbox",
        key: "6",
      },
      worldLevel7: {
        label: "7",
        type: "checkbox",
        key: "7",
      },
      worldLevel8: {
        label: "8",
        type: "checkbox",
        key: "8",
      },
      worldLevel9: {
        label: "9",
        type: "checkbox",
        key: "9",
      },
    };

    const container = document.createElement("div");
    this.element.appendChild(container);
    for(const id in content) {
      if(content.hasOwnProperty(id)) {
        const newElement = document.createElement("div");

        const newLabel = document.createElement("div");
        newLabel.innerHTML = content[id].label;
        newLabel.className = "inline";

        const newInput = document.createElement("input");
        newInput.id = this.label + "_" + content[id].label;
        newInput.type = content[id].type;
        newInput.checked = true;
        newInput.value = content[id].key || id;

        newInput.className = "inline";

        newElement.appendChild(newLabel);
        newElement.appendChild(newInput);
        container.appendChild(newElement);

        newInput.onclick = this.onClick.bind(this);
      }
    }
  }

  private service() {
    const debounce = {};
    while (this.userInput.length) {
      const input = this.userInput.pop();
      switch(input.key || input.type) {
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          if(input.type === "keydown" && !debounce[input.key]) {
            debounce[input.key] = true;
            this.onKeyPress(input as KeyboardEvent);
          }
          break;
      }
    }
  }

  private onKeyPress(event: KeyboardEvent) {
    const id = this.label + "_" + event.key;
    const checkBox = document.getElementById(id) as HTMLInputElement;
    if(checkBox) {
      const change = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      checkBox.dispatchEvent(change);
    }
  }

  private onClick(event: MouseEvent) {
    const target = event.target as HTMLInputElement;
    const menuEvent: ICustomInputEvent = {type: "menuevent",
                                  key: target.value,
                                  value: target.checked};
    this.uiMenu.changes[target.value] = menuEvent;
  }
}
