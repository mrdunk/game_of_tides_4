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
var ViewMock = (function (_super) {
    __extends(ViewMock, _super);
    function ViewMock() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.buttonValues = [];
        _this.buttonStates = [];
        return _this;
    }
    ViewMock.prototype.setButtonValue = function (buttonLabel, value) {
        this.buttonValues.push([buttonLabel, value]);
    };
    ViewMock.prototype.setButtonState = function (buttonLabel, state) {
        this.buttonStates.push([buttonLabel, state]);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2hpcHlhcmQyL2NvbnRyb2xsZXIudHMiLCJzcmMvc2hpcHlhcmQyL21vZGVsLnRzIiwic3JjL3NoaXB5YXJkMi9zaGlweWFyZC50cyIsInNyYy9zaGlweWFyZDIvdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQSwrQ0FBK0M7O0FBUy9DO0lBWUUsb0JBQVksS0FBWSxFQUFFLEtBQWlCO1FBQTNDLGlCQWtCQztRQXpCTyxpQkFBWSxHQUFHO1lBQ3JCLE9BQU8sRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxFQUFDO1lBQ3BELE1BQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFDO1lBQ3BELE1BQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFDO1lBQ3BELFNBQVMsRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBQztTQUNyQyxDQUFDO1FBR0EsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBRSwyQ0FBMkM7UUFDaEUsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7UUFFeEIsRUFBRSxDQUFBLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNULEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkIsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBQyxJQUFJO1lBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMs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QyxDQUFDO2dCQUNoRCxZQUFZLEdBQUcsTUFBTSxDQUFDO1lBQ3hCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxZQUFZLENBQUM7SUFDdEIsQ0FBQztJQUNILGtCQUFDO0FBQUQsQ0FuREEsQUFtREMsQ0FuRGdDLFFBQVEsR0FtRHhDO0FBbkRZLGtDQUFXIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCAyMDE3IGR1bmNhbiBsYXcgKG1yZHVua0BnbWFpbC5jb20pXG5cbmltcG9ydCB7TW9kZWx9IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQge1ZpZXdCYXNlfSBmcm9tIFwiLi92aWV3XCI7XG5cbmludGVyZmFjZSBJQ29tbWFuZCB7XG4gIG5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIENvbnRyb2xsZXIge1xuICBwcml2YXRlIGNvbW1hbmRzOiBJQ29tbWFuZFtdO1xuICBwcml2YXRlIGNvbW1hbmRQb2ludGVyOiBudW1iZXI7XG4gIHByaXZhdGUgdmlld3M6IFZpZXdCYXNlW107XG4gIHByaXZhdGUgbW9kZWw6IE1vZGVsO1xuICBwcml2YXRlIGJ1dHRvblN0YXRlcyA9IHtcbiAgICBhZGRMaW5lOiB7c3RhdGU6IGZhbHNlLCBjbGVhcjogW1wiZGVsZXRlXCIsIFwibWlycm9yXCJdfSxcbiAgICBkZWxldGU6IHtzdGF0ZTogZmFsc2UsIGNsZWFyOiBbXCJhZGRMaW5lXCIsIFwibWlycm9yXCJdfSxcbiAgICBtaXJyb3I6IHtzdGF0ZTogZmFsc2UsIGNsZWFyOiBbXCJhZGRMaW5lXCIsIFwiZGVsZXRlXCJdfSxcbiAgICBhbGxMYXllcnM6IHtzdGF0ZTogZmFsc2UsIGNsZWFyOiBbXX0sXG4gIH07XG5cbiAgY29uc3RydWN0b3IobW9kZWw6IE1vZGVsLCB2aWV3czogVmlld0Jhc2VbXSkge1xuICAgIHRoaXMubW9kZWwgPSBtb2RlbDsgIC8vIFRPRE8gQ2FuIHRoaXMgYmUgYXNzaWduZWQgYXV0b21hdGljYWxseT9cbiAgICB0aGlzLnZpZXdzID0gdmlld3M7XG4gICAgdGhpcy5jb21tYW5kcyA9IFtdO1xuICAgIHRoaXMuY29tbWFuZFBvaW50ZXIgPSAwO1xuXG4gICAgaWYobW9kZWwpIHtcbiAgICAgIG1vZGVsLmluaXQodGhpcyk7XG4gICAgfVxuXG4gICAgdmlld3MuZm9yRWFjaCgodmlldykgPT4ge1xuICAgICAgdmlldy5pbml0KHRoaXMpO1xuICAgIH0pO1xuXG4gICAgdGhpcy52aWV3cy5mb3JFYWNoKCh2aWV3KSA9PiB7XG4gICAgICB2aWV3LnNldEJ1dHRvblN0YXRlKFwidW5kb1wiLCBmYWxzZSk7XG4gICAgICB2aWV3LnNldEJ1dHRvblN0YXRlKFwicmVkb1wiLCB0aGlzLmNvbW1hbmRQb2ludGVyIDwgdGhpcy5jb21tYW5kcy5sZW5ndGgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIG9uQnV0dG9uRXZlbnQoYnV0dG9uTGFiZWw6IHN0cmluZykge1xuICAgIGNvbnNvbGUubG9nKGJ1dHRvbkxhYmVsKTtcblxuICAgIHN3aXRjaCAoYnV0dG9uTGFiZWwpIHtcbiAgICAgIGNhc2UgXCJ1bmRvXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcInJlZG9cIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiY2xlYXJcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiYWRkTGluZVwiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJkZWxldGVcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwibWlycm9yXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFsbExheWVyc1wiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJiYWNrZ3JvdW5kXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcInNhdmVcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwibG9hZFwiOlxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUud2FybihcIkludmFsaWQgYnV0dG9uTGFiZWw6XCIsIGJ1dHRvbkxhYmVsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZUJ1dHRvbihidXR0b25MYWJlbCk7XG4gIH1cblxuICBwdWJsaWMgdXBkYXRlQnV0dG9uKGJ1dHRvbkxhYmVsOiBzdHJpbmcpIHtcbiAgICBpZih0aGlzLmJ1dHRvblN0YXRlc1tidXR0b25MYWJlbF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gSnVzdCBhIHNpbXBsZSBub24tdG9nZ2xpbmcgcHVzaCBidXR0b24uXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5idXR0b25TdGF0ZXNbYnV0dG9uTGFiZWxdLnZhbHVlID1cbiAgICAgICF0aGlzLmJ1dHRvblN0YXRlc1tidXR0b25MYWJlbF0udmFsdWU7XG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLmJ1dHRvblN0YXRlc1tidXR0b25MYWJlbF0udmFsdWU7XG4gICAgdGhpcy52aWV3cy5mb3JFYWNoKCh2aWV3KSA9PiB7XG4gICAgICB2aWV3LnNldEJ1dHRvblZhbHVlKGJ1dHRvbkxhYmVsLCB2YWx1ZSk7XG4gICAgICB0aGlzLmJ1dHRvblN0YXRlc1tidXR0b25MYWJlbF0uY2xlYXIuZm9yRWFjaCgob3RoZXJCdXR0b25MYWJlbCkgPT4ge1xuICAgICAgICB0aGlzLmJ1dHRvblN0YXRlc1tvdGhlckJ1dHRvbkxhYmVsXS52YWx1ZSA9IGZhbHNlO1xuICAgICAgICB2aWV3LnNldEJ1dHRvblZhbHVlKG90aGVyQnV0dG9uTGFiZWwsIGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZWNvcmRDb21tYW5kKGNvbW1hbmQ6IElDb21tYW5kKSB7XG4gICAgdGhpcy5jb21tYW5kcy5wdXNoKGNvbW1hbmQpO1xuXG4gICAgdGhpcy52aWV3cy5mb3JFYWNoKCh2aWV3KSA9PiB7XG4gICAgICB2aWV3LnNldEJ1dHRvblN0YXRlKFwidW5kb1wiLCB0cnVlKTtcbiAgICAgIHZpZXcuc2V0QnV0dG9uU3RhdGUoXCJyZWRvXCIsIHRoaXMuY29tbWFuZFBvaW50ZXIgPCB0aGlzLmNvbW1hbmRzLmxlbmd0aCk7XG4gICAgfSk7XG4gIH1cbn1cbiIsIi8vIENvcHlyaWdodCAyMDE3IGR1bmNhbiBsYXcgKG1yZHVua0BnbWFpbC5jb20pXG5cbmltcG9ydCB7Q29udHJvbGxlcn0gZnJvbSBcIi4vY29udHJvbGxlclwiO1xuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBwcml2YXRlIGNvbnRyb2xsZXI6IENvbnRyb2xsZXI7XG4gIHByaXZhdGUgZGF0YSA9IHtcbiAgICBzaGlwOiB7fSxcbiAgfTtcblxuICBwdWJsaWMgaW5pdChjb250cm9sbGVyOiBDb250cm9sbGVyKSB7XG4gICAgdGhpcy5jb250cm9sbGVyID0gY29udHJvbGxlcjtcbiAgfVxufVxuIiwiLy8gQ29weXJpZ2h0IDIwMTcgZHVuY2FuIGxhdyAobXJkdW5rQGdtYWlsLmNvbSlcblxuaW1wb3J0IHtDb250cm9sbGVyfSBmcm9tIFwiLi9jb250cm9sbGVyXCI7XG5pbXBvcnQge01vZGVsfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHtWaWV3VG9vbGJhcn0gZnJvbSBcIi4vdmlld1wiO1xuXG53aW5kb3cub25sb2FkID0gKCkgPT4ge1xuICBjb25zdCBtb2RlbCA9IG5ldyBNb2RlbCgpO1xuICBjb25zdCB0b29sYmFyID0gbmV3IFZpZXdUb29sYmFyKCk7XG4gIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQ29udHJvbGxlcihtb2RlbCwgW3Rvb2xiYXJdKTtcbiAgY29uc29sZS5sb2coXCJzaGlweWFyZC50c1wiKTtcbn07XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBkdW5jYW4gbGF3IChtcmR1bmtAZ21haWwuY29tKVxuXG4vLyBpbXBvcnQgKiBhcyBLb252YSBmcm9tIFwia29udmFcIjtcbmltcG9ydCB7Q29udHJvbGxlcn0gZnJvbSBcIi4vY29udHJvbGxlclwiO1xuXG5leHBvcnQgY2xhc3MgVmlld0Jhc2Uge1xuICBwcm90ZWN0ZWQgY29udHJvbGxlcjogQ29udHJvbGxlcjtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvL1xuICB9XG5cbiAgcHVibGljIGluaXQoY29udHJvbGxlcjogQ29udHJvbGxlcikge1xuICAgIHRoaXMuY29udHJvbGxlciA9IGNvbnRyb2xsZXI7XG4gIH1cblxuICBwdWJsaWMgc2V0QnV0dG9uVmFsdWUoYnV0dG9uTGFiZWw6IHN0cmluZywgdmFsdWU6IGJvb2xlYW4pIHtcbiAgICAvL1xuICB9XG5cbiAgcHVibGljIHNldEJ1dHRvblN0YXRlKGJ1dHRvbkxhYmVsOiBzdHJpbmcsIHN0YXRlOiBib29sZWFuKSB7XG4gICAgLy9cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVmlld01vY2sgZXh0ZW5kcyBWaWV3QmFzZSB7XG4gIHB1YmxpYyBidXR0b25WYWx1ZXMgPSBbXTtcbiAgcHVibGljIGJ1dHRvblN0YXRlcyA9IFtdO1xuXG4gIHB1YmxpYyBzZXRCdXR0b25WYWx1ZShidXR0b25MYWJlbDogc3RyaW5nLCB2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuYnV0dG9uVmFsdWVzLnB1c2goW2J1dHRvbkxhYmVsLCB2YWx1ZV0pO1xuICB9XG5cbiAgcHVibGljIHNldEJ1dHRvblN0YXRlKGJ1dHRvbkxhYmVsOiBzdHJpbmcsIHN0YXRlOiBib29sZWFuKSB7XG4gICAgdGhpcy5idXR0b25TdGF0ZXMucHVzaChbYnV0dG9uTGFiZWwsIHN0YXRlXSk7XG4gIH1cblxuICBwdWJsaWMgc2ltdWxhdGVCdXR0b25QcmVzcyhidXR0b25MYWJlbDogc3RyaW5nKSB7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uQnV0dG9uRXZlbnQoYnV0dG9uTGFiZWwpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBWaWV3VG9vbGJhciBleHRlbmRzIFZpZXdCYXNlIHtcbiAgcHJpdmF0ZSBidXR0b25FbGVtZW50czogRWxlbWVudFtdO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgY29uc29sZS5sb2coXCJWaWV3VG9vbGJhcigpXCIpO1xuXG4gICAgdGhpcy5idXR0b25FbGVtZW50cyA9XG4gICAgICBbXS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIucHVyZS1idXR0b25cIikpO1xuICAgIHRoaXMuYnV0dG9uRWxlbWVudHMuZm9yRWFjaCgoYnV0dG9uKSA9PiB7XG4gICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMub25DbGljay5iaW5kKHRoaXMpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRCdXR0b25WYWx1ZShidXR0b25MYWJlbDogc3RyaW5nLCB2YWx1ZTogYm9vbGVhbikge1xuICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuZ2V0QnV0dG9uQnlMYWJlbChidXR0b25MYWJlbCk7XG4gICAgaWYoYnV0dG9uKSB7XG4gICAgICBpZih2YWx1ZSkge1xuICAgICAgICBidXR0b24uY2xhc3NMaXN0LmFkZChcInB1cmUtYnV0dG9uLWFjdGl2ZVwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwicHVyZS1idXR0b24tYWN0aXZlXCIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzZXRCdXR0b25TdGF0ZShidXR0b25MYWJlbDogc3RyaW5nLCBzdGF0ZTogYm9vbGVhbikge1xuICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuZ2V0QnV0dG9uQnlMYWJlbChidXR0b25MYWJlbCk7XG4gICAgaWYoYnV0dG9uKSB7XG4gICAgICBpZihzdGF0ZSkge1xuICAgICAgICBidXR0b24uY2xhc3NMaXN0LnJlbW92ZShcInB1cmUtYnV0dG9uLWRpc2FibGVkXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJwdXJlLWJ1dHRvbi1kaXNhYmxlZFwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uQ2xpY2soZXZlbnQ6IEV2ZW50KSB7XG4gICAgY29uc3QgYnV0dG9uID0gZXZlbnQuY3VycmVudFRhcmdldCBhcyBFbGVtZW50O1xuICAgIGNvbnN0IGJ1dHRvbkxhYmVsID0gYnV0dG9uLmdldEF0dHJpYnV0ZShcImxhYmVsXCIpO1xuICAgIHRoaXMuY29udHJvbGxlci5vbkJ1dHRvbkV2ZW50KGJ1dHRvbkxhYmVsKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QnV0dG9uQnlMYWJlbChidXR0b25MYWJlbDogc3RyaW5nKTogRWxlbWVudCB7XG4gICAgbGV0IHJldHVybkJ1dHRvbjogRWxlbWVudDtcbiAgICB0aGlzLmJ1dHRvbkVsZW1lbnRzLmZvckVhY2goKGJ1dHRvbikgPT4ge1xuICAgICAgaWYoYnV0dG9uTGFiZWwgPT09IGJ1dHRvbi5nZXRBdHRyaWJ1dGUoXCJsYWJlbFwiKSkge1xuICAgICAgICByZXR1cm5CdXR0b24gPSBidXR0b247XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJldHVybkJ1dHRvbjtcbiAgfVxufVxuIl19
