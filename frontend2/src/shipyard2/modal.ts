// Copyright 2017 duncan law (mrdunk@gmail.com)

export class Modal {
  public element: HTMLDivElement;
  private background: HTMLDivElement;

  constructor() {
    this.background = document.createElement("div");
    this.element = document.createElement("div");
    this.background.className = "greyModal";
    this.element.className = "modalContent";
    this.background.addEventListener("click", this.hide.bind(this));
    document.body.appendChild(this.background);
    document.body.appendChild(this.element);
    this.hide();
  }

  public show(value?: number) {
    console.log("Modal.show(", value, ")");
    if(value === 0) {
      this.hide();
      return;
    }
    this.background.style.display = "block";
    this.element.style.display = "block";
  }

  public hide() {
    console.log("Modal.hide()");
    this.background.style.display = "none";
    this.element.style.display = "none";
  }

  public clear() {
    while(this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }
    // this.element.innerHTML = "";
  }

  public add(content: HTMLDivElement) {
    this.element.appendChild(content);
  }
}

export class DropDown {
  public element: HTMLElement;
  private BoundOnMouseMove;
  private BoundOnMouseUp;

  constructor(parent: HTMLElement) {
    this.element = parent;
    this.element.className = "dropDownContent";
    this.hide();

    this.handle = this.element.getElementsByClassName("dragable")[0];
    if(this.handle) {
      this.handle.addEventListener("mousedown", this.onMouseDown.bind(this));
    }

    this.BoundOnMouseMove = this.onMouseMove.bind(this);
    this.BoundOnMouseUp = this.onMouseUp.bind(this);
  }

  public show(value?: number) {
    // console.log("Modal.show(", value, ")");
    if(value === 0) {
      this.hide();
      return;
    }
    this.element.style.display = "block";
  }

  public hide() {
    // console.log("Modal.hide()");
    this.element.style.display = "none";
  }

  private onMouseDown(event) {
    // console.log("onMouseDown");
    event = event || window.event;
    this.handle.addEventListener("mousemove", this.BoundOnMouseMove);
    this.handle.addEventListener("mouseup", this.BoundOnMouseUp);
    this.handle.addEventListener("mouseout", this.BoundOnMouseUp);
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  private onMouseUp() {
    // console.log("onMouseUp");
    this.handle.removeEventListener("mousemove", this.BoundOnMouseMove);
    this.handle.removeEventListener("mouseup", this.BoundOnMouseUp);
    this.handle.removeEventListener("mouseout", this.BoundOnMouseUp);
  }

  private onMouseMove(event) {
    // console.log("onMouseMove");
    event = event || window.event;
    const x = event.clientX - this.lastX;
    const y = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    this.element.style.top = (this.element.offsetTop + y) + "px";
    this.element.style.left = (this.element.offsetLeft + x) + "px";
  }
}

