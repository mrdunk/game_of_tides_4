class UIMaster {
    static registerListiner(listiner) {
        UIMaster.listiners.push(listiner);
    }
    static service(now) {
        UIMaster.listiners.forEach((listiner) => {
            // console.log(listiner.newData);
            listiner.service(now);
            UIMaster.clientMessageQueues.forEach((queue) => {
                const newData = listiner.newData.slice(); // Copy array.
                queue.push(...newData);
            });
            UIMaster.clearListinerKeys();
        });
    }
    static clearListinerKeys() {
        UIMaster.listiners.forEach((listiner) => {
            listiner.newData.splice(0, listiner.newData.length);
        });
    }
    static resetListinerKeys() {
        console.log("UIMaster.resetListinerKeys()");
        UIMaster.listiners.forEach((listiner) => {
            listiner.resetListinerKeys();
        });
    }
}
UIMaster.clientMessageQueues = [];
UIMaster.listiners = [];
UIMaster.visibilityCallback = document.addEventListener("visibilitychange", UIMaster.resetListinerKeys);
UIMaster.blurCallback = window.addEventListener("blur", UIMaster.resetListinerKeys);
class UIBase {
    constructor() {
        this.newData = [];
        UIMaster.registerListiner(this);
    }
}
class UIKeyboard extends UIBase {
    constructor() {
        super();
        this.currentlyDown = {};
        this.lastUpdate = Date.now();
        document.addEventListener("keydown", this.keydown.bind(this));
        document.addEventListener("keyup", this.keyup.bind(this));
    }
    service(now) {
        while (this.lastUpdate < now - timeStep) {
            // Need to do normalize the number of key presses for the actual frame
            // length.
            this.lastUpdate += timeStep;
            for (const key in this.currentlyDown) {
                if (this.currentlyDown.hasOwnProperty(key)) {
                    this.newData.push(this.currentlyDown[key]);
                }
            }
        }
    }
    resetListinerKeys() {
        this.currentlyDown = {};
    }
    keydown(event) {
        this.currentlyDown[event.key] = event;
    }
    keyup(event) {
        delete this.currentlyDown[event.key];
    }
}
class UIMouse extends UIBase {
    constructor() {
        super();
        this.currentlyDown = {};
        document.addEventListener("mousemove", this.mouseMove.bind(this));
        document.addEventListener("mousedown", this.mouseDown.bind(this));
        document.addEventListener("mouseup", this.mouseUp.bind(this));
    }
    service(now) {
        for (const key in this.currentlyDown) {
            if (this.currentlyDown.hasOwnProperty(key)) {
                this.newData.push(this.currentlyDown[key]);
            }
        }
        delete this.currentlyDown["mousemove"];
    }
    resetListinerKeys() {
        this.currentlyDown = {};
    }
    mouseMove(event) {
        this.currentlyDown["mousemove"] = event;
    }
    mouseDown(event) {
        this.currentlyDown["mousedown"] = event;
    }
    mouseUp(event) {
        delete this.currentlyDown["mousedown"];
    }
}
class UIMenu extends UIBase {
    constructor() {
        super();
        this.changes = {};
    }
    service(now) {
        for (const key in this.changes) {
            if (this.changes.hasOwnProperty(key)) {
                this.newData.push(this.changes[key]);
            }
        }
        this.changes = {};
    }
    resetListinerKeys() {
        // pass
    }
}
