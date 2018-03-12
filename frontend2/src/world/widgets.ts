// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as THREE from "three";
import {ICustomInputEvent} from "../common/interfaces";
import {Camera, Renderer, Scene} from "./3d";
import {BrowserInfo} from "./browser_info";
import {Globals} from "./globals";
import {MainLoop} from "./main_loop";

function elementSize(element) {
  const copy = element.cloneNode(true);
  copy.style.display = "inline-block";
  document.body.appendChild(copy);
  const w = copy.scrollWidth;
  const h = copy.scrollHeight;
  document.body.removeChild(copy);
  return {w, h};
}

class WidgetBase {
  public element: HTMLElement;
  protected content: HTMLElement;
  protected elementHeight: string = "";
  protected contentHeight: string = "";
  protected elementWidth: string = "";
  protected contentWidth: string = "";
  protected sizeState: boolean = true;

  constructor(public label: string,
              public width?: number,
              public height?: number) {
    const sizeState = localStorage.getItem(this.label + "__sizeState");
    this.sizeState = (sizeState === "true");

    this.element = document.getElementById(label);
    if(!this.element) {
      this.element = document.createElement("div");
    }
    this.element.classList.add("widget");

    const button = document.createElement("div");
    button.innerHTML = "-";
    button.classList.add("button");
    this.element.appendChild(button);
    button.addEventListener("click", this.shrinkGrow.bind(this));

    this.content = document.createElement("div");
    this.element.appendChild(this.content);
    this.content.classList.add("content");

    if(this.width !== undefined) {
      this.elementWidth = "" + this.width + "px";
    }
    if(this.height !== undefined) {
      this.elementHeight = "" + this.height + "px";
    }

    this.setSize();
  }

  protected setSize() {
    console.log("WidgetBase.setSize()", this.label, this.sizeState);
    if(this.sizeState) {
      if(this.elementHeight !== "") {
        this.element.style.height = this.elementHeight;
      }

      if(this.elementWidth !== "") {
        this.element.style.width = this.elementWidth;
      }

      this.content.style.width = this.contentWidth;
      this.content.style.height = this.contentHeight;
    } else {
      if(this.element.style.height !== "") {
        this.elementHeight = this.element.style.height;
        this.element.style.height = "0";
      }

      if(this.content.style.height !== "") {
        this.contentHeight = this.content.style.height;
      } else if(this.content.scrollHeight > 0) {
        this.contentHeight = "" + this.content.scrollHeight + "px";
      }
      this.content.style.height = "0";

      if(this.element.style.width !== "") {
        this.elementWidth = this.element.style.width;
        this.element.style.width = "0";
      }

      if(this.content.style.width !== "") {
        this.contentWidth = this.content.style.width;
      } else if(this.content.scrollWidth > 0) {
        this.contentWidth = "" + this.content.scrollWidth + "px";
      }
      this.content.style.width = "0";
    }
  }

  private shrinkGrow() {
    console.log("WidgetBase.shrinkGrow()", this.label, this.sizeState);
    this.sizeState = !this.sizeState;
    localStorage.setItem(this.label + "__sizeState", "" + this.sizeState);
    this.setSize();
  }
}

export class StatusWidget extends WidgetBase {
  private message: HTMLElement;
  private scene: Scene;

  constructor(scene) {
    super("FPS", 100, 50);
    this.scene = scene;
    setInterval(this.service.bind(this), 1000);

    this.message = document.createElement("div");
    this.message.classList.add("message");

    this.content.appendChild(this.message);

    this.content.classList.add("centered");
    this.message.classList.add("centered");
  }

  public service() {
    this.message.innerHTML = "FPS: " + Math.round(MainLoop.FPS) + "<br/>";
    if(this.scene.updating) {
      this.message.innerHTML += "updating world";
    }

    const bar = document.createElement("div");
    bar.classList.add("bar");
    if(Date.now() - MainLoop.lastDrawFrame <= 1000) {
      const height = 0.8 * this.height * MainLoop.FPS / Globals.maxFps;
      bar.style.background = "cadetblue";
      bar.style.height = "" + Math.round(height) + "px";
    }
    this.content.appendChild(bar);
    while(this.content.childElementCount > this.width) {
      this.content.removeChild(this.content.childNodes[1]);
    }
    this.content.classList.add("graph");
  }
}

export class CameraPositionWidget extends WidgetBase {
  constructor(private camera: Camera) {
    super("CameraPos", 180, 50);
    setInterval(this.service.bind(this), 20);
    this.content.classList.add("centered");
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

    const height = Math.round(this.camera.distance * 1000);

    const degLat = Math.floor(this.camera.lat);
    const minLat = Math.floor((this.camera.lat - degLat) * 60);
    const degLon = Math.floor(this.camera.lon);
    const minLon = Math.floor((this.camera.lon - degLon) * 60);
    this.content.innerHTML =
      "lat: " + degLat + "\xB0&nbsp;" + minLat + "'" +
      "&nbsp;&nbsp;&nbsp;" +
      "lon: " + degLon + "\xB0&nbsp;" + minLon + "'" +
      "<br>" +
      "pitch: " + pitchString + "&nbsp;&nbsp;&nbsp;yaw: " + yawString +
      "<br>" +
      "height: " + height + "m";
  }
}

export class MenuWidget extends WidgetBase {
  public userInput: Array<KeyboardEvent | ICustomInputEvent> = [];
  private recursion: number;

  constructor(private uIMaster,
              private uIMenu,
              private scene: Scene) {
    super("world_tiles");
    setInterval(this.service.bind(this), 1000);

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
      worldLevel10: {
        label: "10",
        type: "checkbox",
        key: "10",
      },
      worldLevel11: {
        label: "11",
        type: "checkbox",
        key: "11",
      },
      worldLevel12: {
        label: "12",
        type: "checkbox",
        key: "12",
      },
      worldLevel13: {
        label: "13",
        type: "checkbox",
        key: "13",
      },
      worldLevel14: {
        label: "14",
        type: "checkbox",
        key: "14",
      },
      overideRecursion: {
        label: "Overide recursion",
        type: "number",
        key: "overideRecursion",
      },
      detailLevel: {
        label: "Detail",
        type: "number",
        key: "overideDetail",
      },
    };

    for(const id in content) {
      if(content.hasOwnProperty(id)) {
        const newElement = document.createElement("div");
        newElement.classList.add(content[id].key);
        if(Number.parseInt(content[id].key, 10)) {
          newElement.classList.add("showRecursionLevel");
        }

        const newLabel = document.createElement("div");
        newLabel.innerHTML = content[id].label;
        newLabel.className = "inline";

        const newInput = document.createElement("input");
        newInput.id = this.label + "_" + content[id].key;
        newInput.name = content[id].key;
        newInput.type = content[id].type;
        newInput.checked = true;
        newInput.value = content[id].value || content[id].key || id;
        if(content[id].min !== undefined) {
          newInput.min = content[id].min;
        }
        if(content[id].max !== undefined) {
          newInput.max = content[id].max;
        }

        newInput.className = "inline";

        newElement.appendChild(newLabel);
        newElement.appendChild(newInput);
        this.content.appendChild(newElement);

        newInput.onclick = this.onClick.bind(this);
      }
    }

    const detailElement =
      this.content.getElementsByClassName("overideDetail")[0];
    detailElement.getElementsByTagName("input")[0].value =
      "" + this.scene.tileDetail;
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
        case "10":
        case "11":
        case "12":
        case "13":
        case "14":
          if(input.type === "keydown" && !debounce[input.key]) {
            debounce[input.key] = true;
            this.onKeyPress(input as KeyboardEvent);
          }
          break;
      }
    }
    if(this.recursion !== this.scene.generateTileLevel) {
      this.setRecursion();
    }
  }

  private setRecursion() {
    this.recursion = this.scene.generateTileLevel;
    const elements = Array.prototype.slice.call(
      this.content.getElementsByTagName("div"),
    ).filter((element) => element.parentElement === this.content);

    for(let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if(element.classList.contains("showRecursionLevel")) {
        element.style.display = (i <= this.recursion)?"block":"none";
      } else if(element.classList.contains("overideRecursion")) {
        element.getElementsByTagName("input")[0].value = this.recursion;
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
    let menuEvent: ICustomInputEvent;
    if(target.type === "checkbox") {
      menuEvent = {type: "menuevent",
                   key: target.value,
                   value: target.checked};
    } else {
      menuEvent = {type: "menuevent",
                   key: target.name,
                   value: target.value};
    }
    this.uIMenu.changes[target.value] = menuEvent;
  }
}

export class CursorPositionWidget extends WidgetBase {
  private container: HTMLElement;

  constructor(private scene: Scene) {
    super("CursorPos", 100, 50);
    setInterval(this.service.bind(this), 200);
    this.content.classList.add("centered");
    this.container = document.createElement("div");
    this.content.appendChild(this.container);
  }

  public service() {
    this.container.innerHTML = "";
    const face = this.scene.faceUnderMouse;
    if(face === undefined) {
      return;
    }

    const sizeDiv = document.createElement("div");
    this.container.appendChild(sizeDiv);

    const point0 = new THREE.Vector3(0, 0, 0);
    const point1 = new THREE.Vector3(0, 0, 0);
    const point2 = new THREE.Vector3(0, 0, 0);

    point0.copy(face.points[0].point);
    point1.copy(face.points[1].point);
    point2.copy(face.points[2].point);

    const size = Math.round(1000 * (point0.distanceTo(point1) +
                                    point1.distanceTo(point2) +
                                    point2.distanceTo(point0)) / 3) / 1000;
    sizeDiv.innerHTML = "size: " + size;


    /*const tileLabel = this.scene.makeTileLabel(
      face.indexHigh,
      face.indexLow,
      this.scene.generateTileLevel);
    const tile = this.scene.activeMeshes[tileLabel];

    if(tile === undefined) {
      return;
    }

    const tileDiv = document.createElement("div");
    this.container.appendChild(tileDiv);
    tileDiv.innerHTML = "" + tile.userData.label;

    tile.userData.neighbours.forEach((neighbour, i) => {
      const neighbourDiv = document.createElement("div");
      this.container.appendChild(neighbourDiv);
      neighbourDiv.innerHTML = "" + i + " " +
        neighbour.indexHigh + " " +
        neighbour.indexLow + " ";
    });*/
  }
}

export class BrowserInfoWidget extends WidgetBase {
  constructor(private browserInfo: BrowserInfo) {
    super("BrowserInfo");
    setInterval(this.service.bind(this), 10000);

    this.service();
  }

  public service() {
    this.content.innerHTML = this.browserInfo.returnHtml().innerHTML;
    this.setSize();
  }

  protected setSize() {
    if(this.sizeState) {
      const lineCount = this.content.childElementCount;
      this.content.style.height = "" + lineCount + "em";

      let lineWidth = 0;
      this.content.childNodes.forEach((node) => {
        const w = elementSize(node).w;
        if(w > lineWidth) {
          lineWidth = w;
        }
      });
      this.content.style.width = "" + lineWidth + "px";
    } else {
      this.content.style.height = "0";
      this.content.style.width = "0";
    }
  }
}

