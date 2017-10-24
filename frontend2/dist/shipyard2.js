(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
// Copyright 2017 duncan law (mrdunk@gmail.com)
Object.defineProperty(exports, "__esModule", { value: true });
var Controller = (function () {
    function Controller(model, views) {
        var _this = this;
        this.buttonStates = {
            addLine: { state: false, clear: ["delete", "mirror"] },
            delete: { state: false, clear: ["addLine", "mirror"] },
            mirror: { state: false, clear: ["addLine", "delete"] },
            allLayers: { state: false, clear: [] },
        };
        this.model = model; // TODO Can this be assigned automatically?
        this.views = views;
        this.commands = [];
        this.commandPointer = 0;
        if (model) {
            model.init(this);
        }
        views.forEach(function (view) {
            view.init(_this);
        });
        this.views.forEach(function (view) {
            view.setButtonState("undo", false);
            view.setButtonState("redo", _this.commandPointer < _this.commands.length);
        });
    }
    Controller.prototype.onButtonEvent = function (buttonLabel) {
        console.log(buttonLabel);
        switch (buttonLabel) {
            case "undo":
                break;
            case "redo":
                break;
            case "clear":
                break;
            case "addLine":
                break;
            case "delete":
                break;
            case "mirror":
                break;
            case "allLayers":
                break;
            case "background":
                break;
            case "save":
                break;
            case "load":
                break;
            default:
                console.warn("Invalid buttonLabel:", buttonLabel);
                return;
        }
        this.updateButton(buttonLabel);
    };
    Controller.prototype.updateButton = function (buttonLabel) {
        var _this = this;
        if (this.buttonStates[buttonLabel] === undefined) {
            // Just a simple non-toggling push button.
            return;
        }
        this.buttonStates[buttonLabel].value =
            !this.buttonStates[buttonLabel].value;
        var value = this.buttonStates[buttonLabel].value;
        this.views.forEach(function (view) {
            view.setButtonValue(buttonLabel, value);
            _this.buttonStates[buttonLabel].clear.forEach(function (otherButtonLabel) {
                _this.buttonStates[otherButtonLabel].value = false;
                view.setButtonValue(otherButtonLabel, false);
            });
        });
    };
    Controller.prototype.recordCommand = function (command) {
        var _this = this;
        this.commands.push(command);
        this.views.forEach(function (view) {
            view.setButtonState("undo", true);
            view.setButtonState("redo", _this.commandPointer < _this.commands.length);
        });
    };
    return Controller;
}());
exports.Controller = Controller;

},{}],2:[function(require,module,exports){
"use strict";
// Copyright 2017 duncan law (mrdunk@gmail.com)
Object.defineProperty(exports, "__esModule", { value: true });
var Model = (function () {
    function Model() {
        this.data = {
            ship: {},
        };
    }
    Model.prototype.init = function (controller) {
        this.controller = controller;
    };
    return Model;
}());
exports.Model = Model;

},{}],3:[function(require,module,exports){
"use strict";
// Copyright 2017 duncan law (mrdunk@gmail.com)
Object.defineProperty(exports, "__esModule", { value: true });
var controller_1 = require("./controller");
var model_1 = require("./model");
var view_1 = require("./view");
window.onload = function () {
    var model = new model_1.Model();
    var toolbar = new view_1.ViewToolbar();
    var controller = new controller_1.Controller(model, [toolbar]);
    console.log("shipyard.ts");
};

},{"./controller":1,"./model":2,"./view":4}],4:[function(require,module,exports){
"use strict";
// Copyright 2017 duncan law (mrdunk@gmail.com)
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
Object.defineProperty(exports, "__esModule", { value: true });
var ViewBase = (function () {
    function ViewBase() {
        //
    }
    ViewBase.prototype.init = function (controller) {
        this.controller = controller;
    };
    ViewBase.prototype.setButtonValue = function (buttonLabel, value) {
        //
    };
    ViewBase.prototype.setButtonState = function (buttonLabel, state) {
        //
    };
    return ViewBase;
}());
exports.ViewBase = ViewBase;
var ViewToolbar = (function (_super) {
    __extends(ViewToolbar, _super);
    function ViewToolbar() {
        var _this = _super.call(this) || this;
        console.log("ViewToolbar()");
        _this.buttonElements =
            [].slice.call(document.querySelectorAll(".pure-button"));
        _this.buttonElements.forEach(function (button) {
            button.addEventListener("click", _this.onClick.bind(_this));
        });
        return _this;
    }
    ViewToolbar.prototype.setButtonValue = function (buttonLabel, value) {
        var button = this.getButtonByLabel(buttonLabel);
        if (button) {
            if (value) {
                button.classList.add("pure-button-active");
            }
            else {
                button.classList.remove("pure-button-active");
            }
        }
    };
    ViewToolbar.prototype.setButtonState = function (buttonLabel, state) {
        var button = this.getButtonByLabel(buttonLabel);
        if (button) {
            if (state) {
                button.classList.remove("pure-button-disabled");
            }
            else {
                button.classList.add("pure-button-disabled");
            }
        }
    };
    ViewToolbar.prototype.onClick = function (event) {
        var button = event.currentTarget;
        var buttonLabel = button.getAttribute("label");
        this.controller.onButtonEvent(buttonLabel);
    };
    ViewToolbar.prototype.getButtonByLabel = function (buttonLabel) {
        var returnButton;
        this.buttonElements.forEach(function (button) {
            if (buttonLabel === button.getAttribute("label")) {
                returnButton = button;
            }
        });
        return returnButton;
    };
    return ViewToolbar;
}(ViewBase));
exports.ViewToolbar = ViewToolbar;

},{}]},{},[1,2,3,4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2hpcHlhcmQyL2NvbnRyb2xsZXIudHMiLCJzcmMvc2hpcHlhcmQyL21vZGVsLnRzIiwic3JjL3NoaXB5YXJkMi9zaGlweWFyZC50cyIsInNyYy9zaGlweWFyZDIvdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQSwrQ0FBK0M7O0FBUy9DO0lBWUUsb0JBQVksS0FBWSxFQUFFLEtBQWlCO1FBQTNDLGlCQWtCQztRQXpCTyxpQkFBWSxHQUFHO1lBQ3JCLE9BQU8sRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxFQUFDO1lBQ3BELE1BQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFDO1lBQ3BELE1BQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFDO1lBQ3BELFNBQVMsRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBQztTQUNyQyxDQUFDO1FBR0EsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBRSwyQ0FBMkM7UUFDaEUsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7UUFFeEIsRUFBRSxDQUFBLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNULEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkIsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBQyxJQUFJO1lBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMs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R0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDL0MsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRU8sNkJBQU8sR0FBZixVQUFnQixLQUFZO1FBQzFCLElBQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxhQUF3QixDQUFDO1FBQzlDLElBQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVPLHNDQUFnQixHQUF4QixVQUF5QixXQUFtQjtRQUMxQyxJQUFJLFlBQXFCLENBQUM7UUFDMUIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsVUFBQyxNQUFNO1lBQ2pDLEVBQUUsQ0FBQSxDQUFDLFdBQVcsS0FBSyxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEQsWUFBWSxHQUFHLE1BQU0sQ0FBQztZQUN4QixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxNQUFNLENBQUMsWUFBWSxDQUFDO0lBQ3RCLENBQUM7SUFDSCxrQkFBQztBQUFELENBbkRBLEFBbURDLENBbkRnQyxRQUFRLEdBbUR4QztBQW5EWSxrQ0FBVyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgMjAxNyBkdW5jYW4gbGF3IChtcmR1bmtAZ21haWwuY29tKVxuXG5pbXBvcnQge01vZGVsfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHtWaWV3QmFzZX0gZnJvbSBcIi4vdmlld1wiO1xuXG5pbnRlcmZhY2UgSUNvbW1hbmQge1xuICBuYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBDb250cm9sbGVyIHtcbiAgcHJpdmF0ZSBjb21tYW5kczogSUNvbW1hbmRbXTtcbiAgcHJpdmF0ZSBjb21tYW5kUG9pbnRlcjogbnVtYmVyO1xuICBwcml2YXRlIHZpZXdzOiBWaWV3QmFzZVtdO1xuICBwcml2YXRlIG1vZGVsOiBNb2RlbDtcbiAgcHJpdmF0ZSBidXR0b25TdGF0ZXMgPSB7XG4gICAgYWRkTGluZToge3N0YXRlOiBmYWxzZSwgY2xlYXI6IFtcImRlbGV0ZVwiLCBcIm1pcnJvclwiXX0sXG4gICAgZGVsZXRlOiB7c3RhdGU6IGZhbHNlLCBjbGVhcjogW1wiYWRkTGluZVwiLCBcIm1pcnJvclwiXX0sXG4gICAgbWlycm9yOiB7c3RhdGU6IGZhbHNlLCBjbGVhcjogW1wiYWRkTGluZVwiLCBcImRlbGV0ZVwiXX0sXG4gICAgYWxsTGF5ZXJzOiB7c3RhdGU6IGZhbHNlLCBjbGVhcjogW119LFxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKG1vZGVsOiBNb2RlbCwgdmlld3M6IFZpZXdCYXNlW10pIHtcbiAgICB0aGlzLm1vZGVsID0gbW9kZWw7ICAvLyBUT0RPIENhbiB0aGlzIGJlIGFzc2lnbmVkIGF1dG9tYXRpY2FsbHk/XG4gICAgdGhpcy52aWV3cyA9IHZpZXdzO1xuICAgIHRoaXMuY29tbWFuZHMgPSBbXTtcbiAgICB0aGlzLmNvbW1hbmRQb2ludGVyID0gMDtcblxuICAgIGlmKG1vZGVsKSB7XG4gICAgICBtb2RlbC5pbml0KHRoaXMpO1xuICAgIH1cblxuICAgIHZpZXdzLmZvckVhY2goKHZpZXcpID0+IHtcbiAgICAgIHZpZXcuaW5pdCh0aGlzKTtcbiAgICB9KTtcblxuICAgIHRoaXMudmlld3MuZm9yRWFjaCgodmlldykgPT4ge1xuICAgICAgdmlldy5zZXRCdXR0b25TdGF0ZShcInVuZG9cIiwgZmFsc2UpO1xuICAgICAgdmlldy5zZXRCdXR0b25TdGF0ZShcInJlZG9cIiwgdGhpcy5jb21tYW5kUG9pbnRlciA8IHRoaXMuY29tbWFuZHMubGVuZ3RoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBvbkJ1dHRvbkV2ZW50KGJ1dHRvbkxhYmVsOiBzdHJpbmcpIHtcbiAgICBjb25zb2xlLmxvZyhidXR0b25MYWJlbCk7XG5cbiAgICBzd2l0Y2ggKGJ1dHRvbkxhYmVsKSB7XG4gICAgICBjYXNlIFwidW5kb1wiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJyZWRvXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImNsZWFyXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFkZExpbmVcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiZGVsZXRlXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIm1pcnJvclwiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJhbGxMYXllcnNcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiYmFja2dyb3VuZFwiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJzYXZlXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImxvYWRcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb25zb2xlLndhcm4oXCJJbnZhbGlkIGJ1dHRvbkxhYmVsOlwiLCBidXR0b25MYWJlbCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVCdXR0b24oYnV0dG9uTGFiZWwpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZUJ1dHRvbihidXR0b25MYWJlbDogc3RyaW5nKSB7XG4gICAgaWYodGhpcy5idXR0b25TdGF0ZXNbYnV0dG9uTGFiZWxdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIEp1c3QgYSBzaW1wbGUgbm9uLXRvZ2dsaW5nIHB1c2ggYnV0dG9uLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuYnV0dG9uU3RhdGVzW2J1dHRvbkxhYmVsXS52YWx1ZSA9XG4gICAgICAhdGhpcy5idXR0b25TdGF0ZXNbYnV0dG9uTGFiZWxdLnZhbHVlO1xuICAgIGNvbnN0IHZhbHVlID0gdGhpcy5idXR0b25TdGF0ZXNbYnV0dG9uTGFiZWxdLnZhbHVlO1xuICAgIHRoaXMudmlld3MuZm9yRWFjaCgodmlldykgPT4ge1xuICAgICAgdmlldy5zZXRCdXR0b25WYWx1ZShidXR0b25MYWJlbCwgdmFsdWUpO1xuICAgICAgdGhpcy5idXR0b25TdGF0ZXNbYnV0dG9uTGFiZWxdLmNsZWFyLmZvckVhY2goKG90aGVyQnV0dG9uTGFiZWwpID0+IHtcbiAgICAgICAgdGhpcy5idXR0b25TdGF0ZXNbb3RoZXJCdXR0b25MYWJlbF0udmFsdWUgPSBmYWxzZTtcbiAgICAgICAgdmlldy5zZXRCdXR0b25WYWx1ZShvdGhlckJ1dHRvbkxhYmVsLCBmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVjb3JkQ29tbWFuZChjb21tYW5kOiBJQ29tbWFuZCkge1xuICAgIHRoaXMuY29tbWFuZHMucHVzaChjb21tYW5kKTtcblxuICAgIHRoaXMudmlld3MuZm9yRWFjaCgodmlldykgPT4ge1xuICAgICAgdmlldy5zZXRCdXR0b25TdGF0ZShcInVuZG9cIiwgdHJ1ZSk7XG4gICAgICB2aWV3LnNldEJ1dHRvblN0YXRlKFwicmVkb1wiLCB0aGlzLmNvbW1hbmRQb2ludGVyIDwgdGhpcy5jb21tYW5kcy5sZW5ndGgpO1xuICAgIH0pO1xuICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBkdW5jYW4gbGF3IChtcmR1bmtAZ21haWwuY29tKVxuXG5pbXBvcnQge0NvbnRyb2xsZXJ9IGZyb20gXCIuL2NvbnRyb2xsZXJcIjtcblxuZXhwb3J0IGNsYXNzIE1vZGVsIHtcbiAgcHJpdmF0ZSBjb250cm9sbGVyOiBDb250cm9sbGVyO1xuICBwcml2YXRlIGRhdGEgPSB7XG4gICAgc2hpcDoge30sXG4gIH07XG5cbiAgcHVibGljIGluaXQoY29udHJvbGxlcjogQ29udHJvbGxlcikge1xuICAgIHRoaXMuY29udHJvbGxlciA9IGNvbnRyb2xsZXI7XG4gIH1cbn1cbiIsIi8vIENvcHlyaWdodCAyMDE3IGR1bmNhbiBsYXcgKG1yZHVua0BnbWFpbC5jb20pXG5cbmltcG9ydCB7Q29udHJvbGxlcn0gZnJvbSBcIi4vY29udHJvbGxlclwiO1xuaW1wb3J0IHtNb2RlbH0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7Vmlld1Rvb2xiYXJ9IGZyb20gXCIuL3ZpZXdcIjtcblxud2luZG93Lm9ubG9hZCA9ICgpID0+IHtcbiAgY29uc3QgbW9kZWwgPSBuZXcgTW9kZWwoKTtcbiAgY29uc3QgdG9vbGJhciA9IG5ldyBWaWV3VG9vbGJhcigpO1xuICBjb25zdCBjb250cm9sbGVyID0gbmV3IENvbnRyb2xsZXIobW9kZWwsIFt0b29sYmFyXSk7XG4gIGNvbnNvbGUubG9nKFwic2hpcHlhcmQudHNcIik7XG59O1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgZHVuY2FuIGxhdyAobXJkdW5rQGdtYWlsLmNvbSlcblxuLy8gaW1wb3J0ICogYXMgS29udmEgZnJvbSBcImtvbnZhXCI7XG5pbXBvcnQge0NvbnRyb2xsZXJ9IGZyb20gXCIuL2NvbnRyb2xsZXJcIjtcblxuZXhwb3J0IGNsYXNzIFZpZXdCYXNlIHtcbiAgcHJvdGVjdGVkIGNvbnRyb2xsZXI6IENvbnRyb2xsZXI7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLy9cbiAgfVxuXG4gIHB1YmxpYyBpbml0KGNvbnRyb2xsZXI6IENvbnRyb2xsZXIpIHtcbiAgICB0aGlzLmNvbnRyb2xsZXIgPSBjb250cm9sbGVyO1xuICB9XG5cbiAgcHVibGljIHNldEJ1dHRvblZhbHVlKGJ1dHRvbkxhYmVsOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuKSB7XG4gICAgLy9cbiAgfVxuXG4gIHB1YmxpYyBzZXRCdXR0b25TdGF0ZShidXR0b25MYWJlbDogc3RyaW5nLCBzdGF0ZTogYm9vbGVhbikge1xuICAgIC8vXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFZpZXdUb29sYmFyIGV4dGVuZHMgVmlld0Jhc2Uge1xuICBwcml2YXRlIGJ1dHRvbkVsZW1lbnRzOiBFbGVtZW50W107XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICBjb25zb2xlLmxvZyhcIlZpZXdUb29sYmFyKClcIik7XG5cbiAgICB0aGlzLmJ1dHRvbkVsZW1lbnRzID1cbiAgICAgIFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5wdXJlLWJ1dHRvblwiKSk7XG4gICAgdGhpcy5idXR0b25FbGVtZW50cy5mb3JFYWNoKChidXR0b24pID0+IHtcbiAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5vbkNsaWNrLmJpbmQodGhpcykpO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIHNldEJ1dHRvblZhbHVlKGJ1dHRvbkxhYmVsOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuKSB7XG4gICAgY29uc3QgYnV0dG9uID0gdGhpcy5nZXRCdXR0b25CeUxhYmVsKGJ1dHRvbkxhYmVsKTtcbiAgICBpZihidXR0b24pIHtcbiAgICAgIGlmKHZhbHVlKSB7XG4gICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwicHVyZS1idXR0b24tYWN0aXZlXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJwdXJlLWJ1dHRvbi1hY3RpdmVcIik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHVibGljIHNldEJ1dHRvblN0YXRlKGJ1dHRvbkxhYmVsOiBzdHJpbmcsIHN0YXRlOiBib29sZWFuKSB7XG4gICAgY29uc3QgYnV0dG9uID0gdGhpcy5nZXRCdXR0b25CeUxhYmVsKGJ1dHRvbkxhYmVsKTtcbiAgICBpZihidXR0b24pIHtcbiAgICAgIGlmKHN0YXRlKSB7XG4gICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwicHVyZS1idXR0b24tZGlzYWJsZWRcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBidXR0b24uY2xhc3NMaXN0LmFkZChcInB1cmUtYnV0dG9uLWRpc2FibGVkXCIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25DbGljayhldmVudDogRXZlbnQpIHtcbiAgICBjb25zdCBidXR0b24gPSBldmVudC5jdXJyZW50VGFyZ2V0IGFzIEVsZW1lbnQ7XG4gICAgY29uc3QgYnV0dG9uTGFiZWwgPSBidXR0b24uZ2V0QXR0cmlidXRlKFwibGFiZWxcIik7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uQnV0dG9uRXZlbnQoYnV0dG9uTGFiZWwpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRCdXR0b25CeUxhYmVsKGJ1dHRvbkxhYmVsOiBzdHJpbmcpOiBFbGVtZW50IHtcbiAgICBsZXQgcmV0dXJuQnV0dG9uOiBFbGVtZW50O1xuICAgIHRoaXMuYnV0dG9uRWxlbWVudHMuZm9yRWFjaCgoYnV0dG9uKSA9PiB7XG4gICAgICBpZihidXR0b25MYWJlbCA9PT0gYnV0dG9uLmdldEF0dHJpYnV0ZShcImxhYmVsXCIpKSB7XG4gICAgICAgIHJldHVybkJ1dHRvbiA9IGJ1dHRvbjtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmV0dXJuQnV0dG9uO1xuICB9XG59XG4iXX0=
