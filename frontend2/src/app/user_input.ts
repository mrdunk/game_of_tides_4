
class UIMaster {
  public static clientMessageQueues = [];

  public static registerListiner(listiner: UIBase) {
    UIMaster.listiners.push(listiner);
  }

  public static service() {
    UIMaster.listiners.forEach((listiner) => {
      listiner.service();
      UIMaster.clientMessageQueues.forEach((queue) => {
        const newData = listiner.newData.slice();  // Copy array.
        queue.push(...newData);
      });
      UIMaster.clearListinerKeys();
    });
  }

  private static visibilityCallback =
      document.addEventListener("visibilitychange", UIMaster.resetListinerKeys);
  private static blurCallback =
      window.addEventListener("blur", UIMaster.resetListinerKeys);

  private static listiners: UIBase[] = [];

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
  public newData: KeyboardEvent[] = [];

  constructor() {
    UIMaster.registerListiner(this);
  }

  public abstract service(): void;
  public abstract resetListinerKeys(): void;
}

class UIKeyboard extends UIBase {
  private currentlyDown: {};

  constructor() {
    super();
    document.addEventListener("keydown", this.keydown.bind(this));
    document.addEventListener("keyup", this.keyup.bind(this));

    this.currentlyDown = {};
  }

  public service() {
    for(const key in this.currentlyDown) {
      if(this.currentlyDown.hasOwnProperty(key)) {
        this.newData.push(this.currentlyDown[key]);
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


