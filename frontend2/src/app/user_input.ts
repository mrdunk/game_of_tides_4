
class UIMaster {
  public static clientMessageQueues = [];

  public static registerListiner(listiner: UIBase) {
    UIMaster.listiners.push(listiner);
  }

  public static service(now: number) {
    UIMaster.listiners.forEach((listiner) => {
      // console.log(listiner.newData);
      listiner.service(now);
      UIMaster.clientMessageQueues.forEach((queue) => {
        const newData = listiner.newData.slice();  // Copy array.
        queue.push(...newData);
      });
      UIMaster.clearListinerKeys();
    });
  }

  private static listiners: UIBase[] = [];

  private static visibilityCallback =
      document.addEventListener("visibilitychange", UIMaster.resetListinerKeys);
  private static blurCallback =
      window.addEventListener("blur", UIMaster.resetListinerKeys);

  private static clearListinerKeys() {
    UIMaster.listiners.forEach((listiner) => {
      listiner.newData.splice(0, listiner.newData.length);
    });
  }

  private static resetListinerKeys() {
    console.log("UIMaster.resetListinerKeys()");
    UIMaster.listiners.forEach((listiner) => {
      listiner.resetListinerKeys();
    });
  }
}


abstract class UIBase {
  public newData: Array<KeyboardEvent | IMouseRay> = [];

  constructor() {
    UIMaster.registerListiner(this);
  }

  public abstract service(now: number): void;
  public abstract resetListinerKeys(): void;
}


class UIKeyboard extends UIBase {
  private currentlyDown: {} = {};
  private lastUpdate: number = Date.now();

  constructor() {
    super();
    document.addEventListener("keydown", this.keydown.bind(this));
    document.addEventListener("keyup", this.keyup.bind(this));
  }

  public service(now: number) {
    while(this.lastUpdate < now - timeStep) {
      // Need to do normalize the number of key presses for the actual frame
      // length.
      this.lastUpdate += timeStep;
      for(const key in this.currentlyDown) {
        if(this.currentlyDown.hasOwnProperty(key)) {
          this.newData.push(this.currentlyDown[key]);
        }
      }
    }
  }

  public resetListinerKeys() {
    this.currentlyDown = {};
  }

  private keydown(event) {
    this.currentlyDown[event.key] = event;
  }

  private keyup(event) {
    delete this.currentlyDown[event.key];
  }
}


class UIMouse extends UIBase {
  private currentlyDown: {} = {};

  constructor() {
    super();
    document.addEventListener("mousemove", this.mouseMove.bind(this));
    document.addEventListener("mousedown", this.mouseDown.bind(this));
    document.addEventListener("mouseup", this.mouseUp.bind(this));
  }

  public service(now: number) {
    for(const key in this.currentlyDown) {
      if(this.currentlyDown.hasOwnProperty(key)) {
        this.newData.push(this.currentlyDown[key]);
      }
    }

    delete this.currentlyDown["mousemove"];
  }

  public resetListinerKeys() {
    this.currentlyDown = {};
  }

  private mouseMove(event) {
    this.currentlyDown["mousemove"] = event;
  }

  private mouseDown(event) {
    this.currentlyDown["mousedown"] = event;
  }

  private mouseUp(event) {
    delete this.currentlyDown["mousedown"];
  }
}


class UIMenu extends UIBase {
  public changes: {} = {};

  constructor() {
    super();
  }

  public service(now: number) {
    for(const key in this.changes) {
      if(this.changes.hasOwnProperty(key)) {
        this.newData.push(this.changes[key]);
      }
    }

    this.changes = {};
  }

  public resetListinerKeys() {
  }
}