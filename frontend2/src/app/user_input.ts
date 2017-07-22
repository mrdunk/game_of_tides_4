class UIMaster {
  public static listiners = [];
  public static clientMessageQueues = [];

  public static service() {
    UIMaster.listiners.forEach((listiner) => {
      UIMaster.clientMessageQueues.forEach((queue) => {
        const newData = listiner.slice();  // Copy array.
        queue.push(...newData);
      });
      listiner.splice(0, listiner.length);
    });
  }
}

class UIBase {
  public newData: string[] = [];

  constructor() {
    UIMaster.listiners.push(this.newData);
  }
}

class UIKeyboard extends UIBase {
  // private currentlyDown: {};

  constructor() {
    super();
    document.addEventListener("keydown", this.keydown.bind(this));
    document.addEventListener("keyup", this.keyup.bind(this));
    // this.currentlyDown = {};
  }

  private keydown(event) {
    // this.currentlyDown[event.key] = {event};
    this.newData.push(event.key);
  }

  private keyup(event) {
    // delete this.currentlyDown[event.key];
  }
}


