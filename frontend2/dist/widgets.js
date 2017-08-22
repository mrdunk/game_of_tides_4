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
var WidgetBase = (function () {
    function WidgetBase(label, width, height) {
        this.label = label;
        this.width = width;
        this.height = height;
        this.elementHeight = "";
        this.contentHeight = "";
        this.sizeState = true;
        this.element = document.getElementById(label);
        if (!this.element) {
            this.element = document.createElement("div");
        }
        this.element.classList.add("widget");
        var button = document.createElement("div");
        button.innerHTML = "-";
        button.classList.add("button");
        this.element.appendChild(button);
        button.addEventListener("click", this.shrinkGrow.bind(this));
        this.content = document.createElement("div");
        this.element.appendChild(this.content);
        this.content.classList.add("content");
        if (width !== undefined) {
            this.element.style.width = "" + width + "px";
        }
        if (height !== undefined) {
            this.element.style.height = "" + height + "px";
        }
    }
    WidgetBase.prototype.shrinkGrow = function () {
        if (this.sizeState) {
            if (this.element.style.height !== "") {
                this.elementHeight = this.element.style.height;
                this.element.style.height = "0";
            }
            this.contentHeight = this.content.style.height;
            this.content.style.height = "0";
        }
        else {
            if (this.elementHeight !== "") {
                this.element.style.height = this.elementHeight;
            }
            this.content.style.height = this.contentHeight;
        }
        this.sizeState = !this.sizeState;
    };
    return WidgetBase;
}());
var StatusWidget = (function (_super) {
    __extends(StatusWidget, _super);
    function StatusWidget() {
        var _this = _super.call(this, "FPS", 100, 50) || this;
        setInterval(_this.service.bind(_this), 1000);
        _this.message = document.createElement("div");
        _this.message.classList.add("message");
        _this.content.appendChild(_this.message);
        _this.content.classList.add("centered");
        _this.message.classList.add("centered");
        return _this;
    }
    StatusWidget.prototype.service = function () {
        this.message.innerHTML = "FPS: " + Math.round(MainLoop.FPS) + "<br/>" +
            "ave: " + Math.round(MainLoop.longAverageFPS);
        var bar = document.createElement("div");
        bar.classList.add("bar");
        if (Date.now() - MainLoop.lastDrawFrame <= 1000) {
            var height = 0.8 * this.height * MainLoop.FPS / maxFps;
            bar.style.background = "cadetblue";
            bar.style.height = "" + Math.round(height) + "px";
        }
        this.content.appendChild(bar);
        while (this.content.childElementCount > this.width) {
            this.content.removeChild(this.content.childNodes[1]);
        }
        this.content.classList.add("graph");
    };
    return StatusWidget;
}(WidgetBase));
var CameraPositionWidget = (function (_super) {
    __extends(CameraPositionWidget, _super);
    function CameraPositionWidget(camera) {
        var _this = _super.call(this, "CameraPos", 180, 50) || this;
        _this.camera = camera;
        setInterval(_this.service.bind(_this), 20);
        _this.content.classList.add("centered");
        return _this;
    }
    CameraPositionWidget.prototype.service = function () {
        var pitch = Math.round(THREE.Math.radToDeg(this.camera.pitch)) - 90;
        var pitchString = "" + pitch + "\xB0";
        var yaw = Math.round(THREE.Math.radToDeg(this.camera.yaw));
        var yawString = "0\xB0";
        if (yaw < 0) {
            yawString = "" + (0 - yaw) + "\xB0E";
        }
        else if (yaw > 0) {
            yawString = "" + yaw + "\xB0W";
        }
        var height = Math.round(this.camera.distance * 1000);
        var degLat = Math.floor(this.camera.lat);
        var minLat = Math.floor((this.camera.lat - degLat) * 60);
        var degLon = Math.floor(this.camera.lon);
        var minLon = Math.floor((this.camera.lon - degLon) * 60);
        this.content.innerHTML =
            "lat: " + degLat + "\xB0&nbsp;" + minLat + "'" +
                "&nbsp;&nbsp;&nbsp;" +
                "lon: " + degLon + "\xB0&nbsp;" + minLon + "'" +
                "<br>" +
                "pitch: " + pitchString + "&nbsp;&nbsp;&nbsp;yaw: " + yawString +
                "<br>" +
                "height: " + height + "m";
    };
    return CameraPositionWidget;
}(WidgetBase));
var MenuWidget = (function (_super) {
    __extends(MenuWidget, _super);
    function MenuWidget(label) {
        var _this = _super.call(this, "Menu") || this;
        _this.label = label;
        _this.userInput = [];
        _this.uiMenu = new UIMenu();
        setInterval(_this.service.bind(_this), 1000);
        UIMaster.clientMessageQueues.push(_this.userInput);
        var content = {
            worldLevelGenerate: {
                label: "cursor size:",
                type: "range",
                key: "generateLevel",
                value: 6,
                min: 1,
                max: 16,
            },
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
        };
        var container = document.createElement("div");
        _this.content.appendChild(container);
        for (var id in content) {
            if (content.hasOwnProperty(id)) {
                var newElement = document.createElement("div");
                var newLabel = document.createElement("div");
                newLabel.innerHTML = content[id].label;
                newLabel.className = "inline";
                var newInput = document.createElement("input");
                newInput.id = _this.label + "_" + content[id].key;
                newInput.name = content[id].key;
                newInput.type = content[id].type;
                newInput.checked = true;
                newInput.value = content[id].value || content[id].key || id;
                if (content[id].min !== undefined) {
                    newInput.min = content[id].min;
                }
                if (content[id].max !== undefined) {
                    newInput.max = content[id].max;
                }
                newInput.className = "inline";
                newElement.appendChild(newLabel);
                newElement.appendChild(newInput);
                container.appendChild(newElement);
                newInput.onclick = _this.onClick.bind(_this);
            }
        }
        return _this;
    }
    MenuWidget.prototype.service = function () {
        var debounce = {};
        while (this.userInput.length) {
            var input = this.userInput.pop();
            switch (input.key || input.type) {
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
                    if (input.type === "keydown" && !debounce[input.key]) {
                        debounce[input.key] = true;
                        this.onKeyPress(input);
                    }
                    break;
            }
        }
    };
    MenuWidget.prototype.onKeyPress = function (event) {
        var id = this.label + "_" + event.key;
        var checkBox = document.getElementById(id);
        if (checkBox) {
            var change = new MouseEvent("click", {
                view: window,
                bubbles: true,
                cancelable: true,
            });
            checkBox.dispatchEvent(change);
        }
    };
    MenuWidget.prototype.onClick = function (event) {
        var target = event.target;
        var menuEvent;
        if (target.type === "checkbox") {
            menuEvent = { type: "menuevent",
                key: target.value,
                value: target.checked };
        }
        else {
            menuEvent = { type: "menuevent",
                key: target.name,
                value: target.value };
        }
        this.uiMenu.changes[target.value] = menuEvent;
    };
    return MenuWidget;
}(WidgetBase));
var CursorPositionWidget = (function (_super) {
    __extends(CursorPositionWidget, _super);
    function CursorPositionWidget(scene) {
        var _this = _super.call(this, "CursorPos", 100, 50) || this;
        _this.scene = scene;
        setInterval(_this.service.bind(_this), 200);
        _this.content.classList.add("centered");
        _this.container = document.createElement("div");
        _this.content.appendChild(_this.container);
        return _this;
    }
    CursorPositionWidget.prototype.service = function () {
        this.container.innerHTML = "";
        var face = this.scene.faceUnderMouse;
        if (face === undefined) {
            return;
        }
        var sizeDiv = document.createElement("div");
        this.container.appendChild(sizeDiv);
        var point0 = new THREE.Vector3(0, 0, 0);
        var point1 = new THREE.Vector3(0, 0, 0);
        var point2 = new THREE.Vector3(0, 0, 0);
        point0.copy(face.points[0].point);
        point1.copy(face.points[1].point);
        point2.copy(face.points[2].point);
        var size = Math.round(1000 * (point0.distanceTo(point1) +
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
    };
    return CursorPositionWidget;
}(WidgetBase));
var BrowserInfo = (function (_super) {
    __extends(BrowserInfo, _super);
    function BrowserInfo() {
        var _this = _super.call(this, "BrowserInfo") || this;
        setInterval(_this.service.bind(_this), 10000);
        var lineCount = 1;
        var keys = ["name", "manufacturer", "layout", "description", "version"];
        keys.forEach(function (key) {
            if (platform[key]) {
                var div = document.createElement("div");
                _this.content.appendChild(div);
                lineCount++;
                div.innerHTML = key + ": " + platform[key];
            }
        });
        var osKeys = ["architecture", "family", "version"];
        osKeys.forEach(function (key) {
            if (platform.os[key]) {
                var div = document.createElement("div");
                _this.content.appendChild(div);
                lineCount++;
                div.innerHTML = "os." + key + ": " + platform.os[key];
            }
        });
        _this.fpsContainer = document.createElement("div");
        _this.content.appendChild(_this.fpsContainer);
        _this.fpsContainer.innerHTML = "FPS: " + MainLoop.longAverageFPS;
        _this.content.style.height = "" + lineCount + "em";
        return _this;
    }
    BrowserInfo.prototype.service = function () {
        this.fpsContainer.innerHTML = "FPS: " + MainLoop.longAverageFPS;
    };
    return BrowserInfo;
}(WidgetBase));
