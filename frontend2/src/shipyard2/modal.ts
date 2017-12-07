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

  constructor(parent: HTMLElement) {
    this.element = parent;  // document.createElement("div");
    this.element.className = "dropDownContent";
    // parent.appendChild(this.element);
    this.hide();
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
}

