(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
// Copyright 2017 duncan law (mrdunk@gmail.com)
Object.defineProperty(exports, "__esModule", { value: true });
var Controller = (function () {
    function Controller(model, views, logger) {
        var _this = this;
        this.buttonStates = {
            addLine: { state: false, clear: ["delete", "mirror"] },
            delete: { state: false, clear: ["addLine", "mirror"] },
            mirror: { state: false, clear: ["addLine", "delete"] },
            allLayers: { state: false, clear: [] },
        };
        this.model = model; // TODO Can this be assigned automatically?
        this.views = views;
        this.logger = logger || console;
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
        this.logger.log(buttonLabel);
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
                this.logger.warn("Invalid buttonLabel:", buttonLabel);
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
var ViewMock = (function (_super) {
    __extends(ViewMock, _super);
    function ViewMock() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.buttonValues = {};
        _this.buttonStates = {};
        return _this;
    }
    ViewMock.prototype.setButtonValue = function (buttonLabel, value) {
        this.buttonValues[buttonLabel] = value;
    };
    ViewMock.prototype.setButtonState = function (buttonLabel, state) {
        this.buttonStates[buttonLabel] = state;
    };
    ViewMock.prototype.simulateButtonPress = function (buttonLabel) {
        this.controller.onButtonEvent(buttonLabel);
    };
    return ViewMock;
}(ViewBase));
exports.ViewMock = ViewMock;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2hpcHlhcmQyL2NvbnRyb2xsZXIudHMiLCJzcmMvc2hpcHlhcmQyL21vZGVsLnRzIiwic3JjL3NoaXB5YXJkMi9zaGlweWFyZC50cyIsInNyYy9zaGlweWFyZDIvdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQSwrQ0FBK0M7O0FBUy9DO0lBYUUsb0JBQVksS0FBWSxFQUFFLEtBQWlCLEVBQUUsTUFBTztRQUFwRCxpQkFtQkM7UUExQk8saUJBQVksR0FBRztZQUNyQixPQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsRUFBQztZQUNwRCxNQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsRUFBQztZQUNwRCxNQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsRUFBQztZQUNwRCxTQUFTLEVBQUUsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUM7U0FDckMsQ0FBQztRQUdBLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUUsMkNBQTJDO1FBQ2hFLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxJQUFJLE9BQU8sQ0FBQztRQUNoQyxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNuQixJQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQztRQUV4QixFQUFFLENBQUEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ1QsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQixDQUFDO1FBRUQs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QU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCxZQUFZLEdBQUcsTUFBTSxDQUFDO1lBQ3hCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxZQUFZLENBQUM7SUFDdEIsQ0FBQztJQUNILGtCQUFDO0FBQUQsQ0FuREEsQUFtREMsQ0FuRGdDLFFBQVEsR0FtRHhDO0FBbkRZLGtDQUFXIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCAyMDE3IGR1bmNhbiBsYXcgKG1yZHVua0BnbWFpbC5jb20pXG5cbmltcG9ydCB7TW9kZWx9IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQge1ZpZXdCYXNlfSBmcm9tIFwiLi92aWV3XCI7XG5cbmludGVyZmFjZSBJQ29tbWFuZCB7XG4gIG5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIENvbnRyb2xsZXIge1xuICBwcml2YXRlIGNvbW1hbmRzOiBJQ29tbWFuZFtdO1xuICBwcml2YXRlIGNvbW1hbmRQb2ludGVyOiBudW1iZXI7XG4gIHByaXZhdGUgdmlld3M6IFZpZXdCYXNlW107XG4gIHByaXZhdGUgbW9kZWw6IE1vZGVsO1xuICBwcml2YXRlIGxvZ2dlcjtcbiAgcHJpdmF0ZSBidXR0b25TdGF0ZXMgPSB7XG4gICAgYWRkTGluZToge3N0YXRlOiBmYWxzZSwgY2xlYXI6IFtcImRlbGV0ZVwiLCBcIm1pcnJvclwiXX0sXG4gICAgZGVsZXRlOiB7c3RhdGU6IGZhbHNlLCBjbGVhcjogW1wiYWRkTGluZVwiLCBcIm1pcnJvclwiXX0sXG4gICAgbWlycm9yOiB7c3RhdGU6IGZhbHNlLCBjbGVhcjogW1wiYWRkTGluZVwiLCBcImRlbGV0ZVwiXX0sXG4gICAgYWxsTGF5ZXJzOiB7c3RhdGU6IGZhbHNlLCBjbGVhcjogW119LFxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKG1vZGVsOiBNb2RlbCwgdmlld3M6IFZpZXdCYXNlW10sIGxvZ2dlcj8pIHtcbiAgICB0aGlzLm1vZGVsID0gbW9kZWw7ICAvLyBUT0RPIENhbiB0aGlzIGJlIGFzc2lnbmVkIGF1dG9tYXRpY2FsbHk/XG4gICAgdGhpcy52aWV3cyA9IHZpZXdzO1xuICAgIHRoaXMubG9nZ2VyID0gbG9nZ2VyIHx8IGNvbnNvbGU7XG4gICAgdGhpcy5jb21tYW5kcyA9IFtdO1xuICAgIHRoaXMuY29tbWFuZFBvaW50ZXIgPSAwO1xuXG4gICAgaWYobW9kZWwpIHtcbiAgICAgIG1vZGVsLmluaXQodGhpcyk7XG4gICAgfVxuXG4gICAgdmlld3MuZm9yRWFjaCgodmlldykgPT4ge1xuICAgICAgdmlldy5pbml0KHRoaXMpO1xuICAgIH0pO1xuXG4gICAgdGhpcy52aWV3cy5mb3JFYWNoKCh2aWV3KSA9PiB7XG4gICAgICB2aWV3LnNldEJ1dHRvblN0YXRlKFwidW5kb1wiLCBmYWxzZSk7XG4gICAgICB2aWV3LnNldEJ1dHRvblN0YXRlKFwicmVkb1wiLCB0aGlzLmNvbW1hbmRQb2ludGVyIDwgdGhpcy5jb21tYW5kcy5sZW5ndGgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIG9uQnV0dG9uRXZlbnQoYnV0dG9uTGFiZWw6IHN0cmluZykge1xuICAgIHRoaXMubG9nZ2VyLmxvZyhidXR0b25MYWJlbCk7XG5cbiAgICBzd2l0Y2ggKGJ1dHRvbkxhYmVsKSB7XG4gICAgICBjYXNlIFwidW5kb1wiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJyZWRvXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImNsZWFyXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFkZExpbmVcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiZGVsZXRlXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIm1pcnJvclwiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJhbGxMYXllcnNcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiYmFja2dyb3VuZFwiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJzYXZlXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImxvYWRcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKFwiSW52YWxpZCBidXR0b25MYWJlbDpcIiwgYnV0dG9uTGFiZWwpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMudXBkYXRlQnV0dG9uKGJ1dHRvbkxhYmVsKTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGVCdXR0b24oYnV0dG9uTGFiZWw6IHN0cmluZykge1xuICAgIGlmKHRoaXMuYnV0dG9uU3RhdGVzW2J1dHRvbkxhYmVsXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBKdXN0IGEgc2ltcGxlIG5vbi10b2dnbGluZyBwdXNoIGJ1dHRvbi5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmJ1dHRvblN0YXRlc1tidXR0b25MYWJlbF0udmFsdWUgPVxuICAgICAgIXRoaXMuYnV0dG9uU3RhdGVzW2J1dHRvbkxhYmVsXS52YWx1ZTtcbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMuYnV0dG9uU3RhdGVzW2J1dHRvbkxhYmVsXS52YWx1ZTtcbiAgICB0aGlzLnZpZXdzLmZvckVhY2goKHZpZXcpID0+IHtcbiAgICAgIHZpZXcuc2V0QnV0dG9uVmFsdWUoYnV0dG9uTGFiZWwsIHZhbHVlKTtcbiAgICAgIHRoaXMuYnV0dG9uU3RhdGVzW2J1dHRvbkxhYmVsXS5jbGVhci5mb3JFYWNoKChvdGhlckJ1dHRvbkxhYmVsKSA9PiB7XG4gICAgICAgIHRoaXMuYnV0dG9uU3RhdGVzW290aGVyQnV0dG9uTGFiZWxdLnZhbHVlID0gZmFsc2U7XG4gICAgICAgIHZpZXcuc2V0QnV0dG9uVmFsdWUob3RoZXJCdXR0b25MYWJlbCwgZmFsc2UpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJlY29yZENvbW1hbmQoY29tbWFuZDogSUNvbW1hbmQpIHtcbiAgICB0aGlzLmNvbW1hbmRzLnB1c2goY29tbWFuZCk7XG5cbiAgICB0aGlzLnZpZXdzLmZvckVhY2goKHZpZXcpID0+IHtcbiAgICAgIHZpZXcuc2V0QnV0dG9uU3RhdGUoXCJ1bmRvXCIsIHRydWUpO1xuICAgICAgdmlldy5zZXRCdXR0b25TdGF0ZShcInJlZG9cIiwgdGhpcy5jb21tYW5kUG9pbnRlciA8IHRoaXMuY29tbWFuZHMubGVuZ3RoKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiLy8gQ29weXJpZ2h0IDIwMTcgZHVuY2FuIGxhdyAobXJkdW5rQGdtYWlsLmNvbSlcblxuaW1wb3J0IHtDb250cm9sbGVyfSBmcm9tIFwiLi9jb250cm9sbGVyXCI7XG5cbmV4cG9ydCBjbGFzcyBNb2RlbCB7XG4gIHByaXZhdGUgY29udHJvbGxlcjogQ29udHJvbGxlcjtcbiAgcHJpdmF0ZSBkYXRhID0ge1xuICAgIHNoaXA6IHt9LFxuICB9O1xuXG4gIHB1YmxpYyBpbml0KGNvbnRyb2xsZXI6IENvbnRyb2xsZXIpIHtcbiAgICB0aGlzLmNvbnRyb2xsZXIgPSBjb250cm9sbGVyO1xuICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBkdW5jYW4gbGF3IChtcmR1bmtAZ21haWwuY29tKVxuXG5pbXBvcnQge0NvbnRyb2xsZXJ9IGZyb20gXCIuL2NvbnRyb2xsZXJcIjtcbmltcG9ydCB7TW9kZWx9IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQge1ZpZXdUb29sYmFyfSBmcm9tIFwiLi92aWV3XCI7XG5cbndpbmRvdy5vbmxvYWQgPSAoKSA9PiB7XG4gIGNvbnN0IG1vZGVsID0gbmV3IE1vZGVsKCk7XG4gIGNvbnN0IHRvb2xiYXIgPSBuZXcgVmlld1Rvb2xiYXIoKTtcbiAgY29uc3QgY29udHJvbGxlciA9IG5ldyBDb250cm9sbGVyKG1vZGVsLCBbdG9vbGJhcl0pO1xuICBjb25zb2xlLmxvZyhcInNoaXB5YXJkLnRzXCIpO1xufTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IGR1bmNhbiBsYXcgKG1yZHVua0BnbWFpbC5jb20pXG5cbi8vIGltcG9ydCAqIGFzIEtvbnZhIGZyb20gXCJrb252YVwiO1xuaW1wb3J0IHtDb250cm9sbGVyfSBmcm9tIFwiLi9jb250cm9sbGVyXCI7XG5cbmV4cG9ydCBjbGFzcyBWaWV3QmFzZSB7XG4gIHByb3RlY3RlZCBjb250cm9sbGVyOiBDb250cm9sbGVyO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vXG4gIH1cblxuICBwdWJsaWMgaW5pdChjb250cm9sbGVyOiBDb250cm9sbGVyKSB7XG4gICAgdGhpcy5jb250cm9sbGVyID0gY29udHJvbGxlcjtcbiAgfVxuXG4gIHB1YmxpYyBzZXRCdXR0b25WYWx1ZShidXR0b25MYWJlbDogc3RyaW5nLCB2YWx1ZTogYm9vbGVhbikge1xuICAgIC8vXG4gIH1cblxuICBwdWJsaWMgc2V0QnV0dG9uU3RhdGUoYnV0dG9uTGFiZWw6IHN0cmluZywgc3RhdGU6IGJvb2xlYW4pIHtcbiAgICAvL1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBWaWV3TW9jayBleHRlbmRzIFZpZXdCYXNlIHtcbiAgcHVibGljIGJ1dHRvblZhbHVlcyA9IHt9O1xuICBwdWJsaWMgYnV0dG9uU3RhdGVzID0ge307XG5cbiAgcHVibGljIHNldEJ1dHRvblZhbHVlKGJ1dHRvbkxhYmVsOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWxdID0gdmFsdWU7XG4gIH1cblxuICBwdWJsaWMgc2V0QnV0dG9uU3RhdGUoYnV0dG9uTGFiZWw6IHN0cmluZywgc3RhdGU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmJ1dHRvblN0YXRlc1tidXR0b25MYWJlbF0gPSBzdGF0ZTtcbiAgfVxuXG4gIHB1YmxpYyBzaW11bGF0ZUJ1dHRvblByZXNzKGJ1dHRvbkxhYmVsOiBzdHJpbmcpIHtcbiAgICB0aGlzLmNvbnRyb2xsZXIub25CdXR0b25FdmVudChidXR0b25MYWJlbCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFZpZXdUb29sYmFyIGV4dGVuZHMgVmlld0Jhc2Uge1xuICBwcml2YXRlIGJ1dHRvbkVsZW1lbnRzOiBFbGVtZW50W107XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICBjb25zb2xlLmxvZyhcIlZpZXdUb29sYmFyKClcIik7XG5cbiAgICB0aGlzLmJ1dHRvbkVsZW1lbnRzID1cbiAgICAgIFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5wdXJlLWJ1dHRvblwiKSk7XG4gICAgdGhpcy5idXR0b25FbGVtZW50cy5mb3JFYWNoKChidXR0b24pID0+IHtcbiAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5vbkNsaWNrLmJpbmQodGhpcykpO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIHNldEJ1dHRvblZhbHVlKGJ1dHRvbkxhYmVsOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuKSB7XG4gICAgY29uc3QgYnV0dG9uID0gdGhpcy5nZXRCdXR0b25CeUxhYmVsKGJ1dHRvbkxhYmVsKTtcbiAgICBpZihidXR0b24pIHtcbiAgICAgIGlmKHZhbHVlKSB7XG4gICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwicHVyZS1idXR0b24tYWN0aXZlXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJwdXJlLWJ1dHRvbi1hY3RpdmVcIik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHVibGljIHNldEJ1dHRvblN0YXRlKGJ1dHRvbkxhYmVsOiBzdHJpbmcsIHN0YXRlOiBib29sZWFuKSB7XG4gICAgY29uc3QgYnV0dG9uID0gdGhpcy5nZXRCdXR0b25CeUxhYmVsKGJ1dHRvbkxhYmVsKTtcbiAgICBpZihidXR0b24pIHtcbiAgICAgIGlmKHN0YXRlKSB7XG4gICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwicHVyZS1idXR0b24tZGlzYWJsZWRcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBidXR0b24uY2xhc3NMaXN0LmFkZChcInB1cmUtYnV0dG9uLWRpc2FibGVkXCIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25DbGljayhldmVudDogRXZlbnQpIHtcbiAgICBjb25zdCBidXR0b24gPSBldmVudC5jdXJyZW50VGFyZ2V0IGFzIEVsZW1lbnQ7XG4gICAgY29uc3QgYnV0dG9uTGFiZWwgPSBidXR0b24uZ2V0QXR0cmlidXRlKFwibGFiZWxcIik7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uQnV0dG9uRXZlbnQoYnV0dG9uTGFiZWwpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRCdXR0b25CeUxhYmVsKGJ1dHRvbkxhYmVsOiBzdHJpbmcpOiBFbGVtZW50IHtcbiAgICBsZXQgcmV0dXJuQnV0dG9uOiBFbGVtZW50O1xuICAgIHRoaXMuYnV0dG9uRWxlbWVudHMuZm9yRWFjaCgoYnV0dG9uKSA9PiB7XG4gICAgICBpZihidXR0b25MYWJlbCA9PT0gYnV0dG9uLmdldEF0dHJpYnV0ZShcImxhYmVsXCIpKSB7XG4gICAgICAgIHJldHVybkJ1dHRvbiA9IGJ1dHRvbjtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmV0dXJuQnV0dG9uO1xuICB9XG59XG4iXX0=
