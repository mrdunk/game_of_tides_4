var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var UIMaster = (function () {
    function UIMaster() {
    }
    UIMaster.registerListiner = function (listiner) {
        UIMaster.listiners.push(listiner);
    };
    UIMaster.service = function (now) {
        UIMaster.listiners.forEach(function (listiner) {
            // console.log(listiner.newData);
            listiner.service(now);
            UIMaster.clientMessageQueues.forEach(function (queue) {
                var newData = listiner.newData.slice(); // Copy array.
                queue.push.apply(// Copy array.
                queue, newData);
            });
            UIMaster.clearListinerKeys();
        });
    };
    UIMaster.clearListinerKeys = function () {
        UIMaster.listiners.forEach(function (listiner) {
            listiner.newData.splice(0, listiner.newData.length);
        });
    };
    UIMaster.resetListinerKeys = function () {
        console.log("UIMaster.resetListinerKeys()");
        UIMaster.listiners.forEach(function (listiner) {
            listiner.resetListinerKeys();
        });
    };
    UIMaster.clientMessageQueues = [];
    UIMaster.listiners = [];
    UIMaster.visibilityCallback = document.addEventListener("visibilitychange", UIMaster.resetListinerKeys);
    UIMaster.blurCallback = window.addEventListener("blur", UIMaster.resetListinerKeys);
    return UIMaster;
}());
var UIBase = (function () {
    function UIBase() {
        this.newData = [];
        UIMaster.registerListiner(this);
    }
    return UIBase;
}());
var UIKeyboard = (function (_super) {
    __extends(UIKeyboard, _super);
    function UIKeyboard() {
        var _this = _super.call(this) || this;
        _this.currentlyDown = {};
        _this.lastUpdate = Date.now();
        document.addEventListener("keydown", _this.keydown.bind(_this));
        document.addEventListener("keyup", _this.keyup.bind(_this));
        return _this;
    }
    UIKeyboard.prototype.service = function (now) {
        while (this.lastUpdate < now - timeStep) {
            // Need to do normalize the number of key presses for the actual frame
            // length.
            this.lastUpdate += timeStep;
            for (var key in this.currentlyDown) {
                if (this.currentlyDown.hasOwnProperty(key)) {
                    this.newData.push(this.currentlyDown[key]);
                }
            }
        }
    };
    UIKeyboard.prototype.resetListinerKeys = function () {
        this.currentlyDown = {};
    };
    UIKeyboard.prototype.keydown = function (event) {
        this.currentlyDown[event.key] = event;
    };
    UIKeyboard.prototype.keyup = function (event) {
        delete this.currentlyDown[event.key];
    };
    return UIKeyboard;
}(UIBase));
var UIMouse = (function (_super) {
    __extends(UIMouse, _super);
    function UIMouse() {
        var _this = _super.call(this) || this;
        _this.currentlyDown = {};
        document.addEventListener("mousemove", _this.mouseMove.bind(_this));
        document.addEventListener("mousedown", _this.mouseDown.bind(_this));
        document.addEventListener("mouseup", _this.mouseUp.bind(_this));
        return _this;
    }
    UIMouse.prototype.service = function (now) {
        for (var key in this.currentlyDown) {
            if (this.currentlyDown.hasOwnProperty(key)) {
                this.newData.push(this.currentlyDown[key]);
            }
        }
        delete this.currentlyDown["mousemove"];
    };
    UIMouse.prototype.resetListinerKeys = function () {
        this.currentlyDown = {};
    };
    UIMouse.prototype.mouseMove = function (event) {
        this.currentlyDown["mousemove"] = event;
    };
    UIMouse.prototype.mouseDown = function (event) {
        this.currentlyDown["mousedown"] = event;
    };
    UIMouse.prototype.mouseUp = function (event) {
        delete this.currentlyDown["mousedown"];
    };
    return UIMouse;
}(UIBase));
var UIMenu = (function (_super) {
    __extends(UIMenu, _super);
    function UIMenu() {
        var _this = _super.call(this) || this;
        _this.changes = {};
        return _this;
    }
    UIMenu.prototype.service = function (now) {
        for (var key in this.changes) {
            if (this.changes.hasOwnProperty(key)) {
                this.newData.push(this.changes[key]);
            }
        }
        this.changes = {};
    };
    UIMenu.prototype.resetListinerKeys = function () {
        // pass
    };
    return UIMenu;
}(UIBase));
