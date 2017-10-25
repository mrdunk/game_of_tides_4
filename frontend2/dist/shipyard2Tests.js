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
var controller_1 = require("./controller");
var view_1 = require("./view");
var LoggerMock = (function () {
    function LoggerMock() {
    }
    LoggerMock.prototype.log = function () {
        var output = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            output[_i] = arguments[_i];
        }
        console.log(this.concatVariables(output));
        this.lastLog = output;
    };
    LoggerMock.prototype.warn = function () {
        var output = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            output[_i] = arguments[_i];
        }
        console.warn(this.concatVariables(output));
        this.lastWarn = output;
    };
    LoggerMock.prototype.concatVariables = function (input) {
        var output = "";
        input.forEach(function (peramiter) {
            output += String(peramiter) + " ";
        });
        return output;
    };
    return LoggerMock;
}());
var TrackAsserts = (function () {
    function TrackAsserts() {
    }
    TrackAsserts.assert = function (value) {
        this.value = this.value && value;
        console.assert(value);
    };
    TrackAsserts.value = true;
    return TrackAsserts;
}());
var testButtons = [
    function testInvalidButton() {
        var model = null;
        var toolbar1 = new view_1.ViewMock();
        var toolbar2 = new view_1.ViewMock();
        var logger = new LoggerMock();
        var controller = new controller_1.Controller(model, [toolbar1, toolbar2], logger);
        var buttonLabel = "someInvalidButton";
        // Perform action under test.
        toolbar1.simulateButtonPress(buttonLabel);
        TrackAsserts.assert(logger.lastWarn[0] === "Invalid buttonLabel:" &&
            logger.lastWarn[1] === buttonLabel);
        TrackAsserts.assert(toolbar1.buttonValues[buttonLabel] === undefined);
        TrackAsserts.assert(toolbar2.buttonValues[buttonLabel] === undefined);
    },
    function testRegularButton() {
        var model = null;
        var toolbar1 = new view_1.ViewMock();
        var toolbar2 = new view_1.ViewMock();
        var logger = new LoggerMock();
        var controller = new controller_1.Controller(model, [toolbar1, toolbar2], logger);
        var buttonLabel = "clear";
        // Perform action under test.
        toolbar1.simulateButtonPress(buttonLabel);
        // Since this button does not stay depressed,
        // there is nothing to update on the view object.
        TrackAsserts.assert(toolbar1.buttonValues[buttonLabel] === undefined);
        TrackAsserts.assert(toolbar2.buttonValues[buttonLabel] === undefined);
    },
    function testSingleToggleButton() {
        var model = null;
        var toolbar1 = new view_1.ViewMock();
        var toolbar2 = new view_1.ViewMock();
        var logger = new LoggerMock();
        var controller = new controller_1.Controller(model, [toolbar1, toolbar2], logger);
        var buttonLabel = "allLayers";
        // Perform action under test.
        toolbar1.simulateButtonPress(buttonLabel);
        // This button stays depressed so it should update the views.
        TrackAsserts.assert(toolbar1.buttonValues[buttonLabel] === true);
        TrackAsserts.assert(toolbar2.buttonValues[buttonLabel] === true);
        // Perform action under test again.
        toolbar1.simulateButtonPress(buttonLabel);
        // Second press should clear button.
        TrackAsserts.assert(toolbar1.buttonValues[buttonLabel] === false);
        TrackAsserts.assert(toolbar2.buttonValues[buttonLabel] === false);
    },
    function testPairedToggleButtons() {
        var model = null;
        var toolbar1 = new view_1.ViewMock();
        var toolbar2 = new view_1.ViewMock();
        var logger = new LoggerMock();
        var controller = new controller_1.Controller(model, [toolbar1, toolbar2], logger);
        // Only one of these buttons can be toggled at once.
        var buttonLabel1 = "addLine";
        var buttonLabel2 = "delete";
        var buttonLabel3 = "mirror";
        // Perform action under test.
        toolbar1.simulateButtonPress(buttonLabel1);
        // This button stays depressed so it should update the views.
        TrackAsserts.assert(toolbar1.buttonValues[buttonLabel1] === true);
        TrackAsserts.assert(toolbar2.buttonValues[buttonLabel1] === true);
        TrackAsserts.assert(toolbar1.buttonValues[buttonLabel2] === false);
        TrackAsserts.assert(toolbar2.buttonValues[buttonLabel2] === false);
        TrackAsserts.assert(toolbar1.buttonValues[buttonLabel3] === false);
        TrackAsserts.assert(toolbar2.buttonValues[buttonLabel3] === false);
        // Perform action under test again.
        toolbar1.simulateButtonPress(buttonLabel1);
        // Second press should clear button.
        TrackAsserts.assert(toolbar1.buttonValues[buttonLabel1] === false);
        TrackAsserts.assert(toolbar2.buttonValues[buttonLabel1] === false);
        TrackAsserts.assert(toolbar1.buttonValues[buttonLabel2] === false);
        TrackAsserts.assert(toolbar2.buttonValues[buttonLabel2] === false);
        TrackAsserts.assert(toolbar1.buttonValues[buttonLabel3] === false);
        TrackAsserts.assert(toolbar2.buttonValues[buttonLabel3] === false);
        // Perform action under test again.
        // Set one button then set a different button.
        toolbar1.simulateButtonPress(buttonLabel1);
        toolbar1.simulateButtonPress(buttonLabel2);
        // Different button press should clear buttonLabel1.
        TrackAsserts.assert(toolbar1.buttonValues[buttonLabel1] === false);
        TrackAsserts.assert(toolbar2.buttonValues[buttonLabel1] === false);
        TrackAsserts.assert(toolbar1.buttonValues[buttonLabel2] === true);
        TrackAsserts.assert(toolbar2.buttonValues[buttonLabel2] === true);
        TrackAsserts.assert(toolbar1.buttonValues[buttonLabel3] === false);
        TrackAsserts.assert(toolbar2.buttonValues[buttonLabel3] === false);
    },
];
window.onload = function () {
    console.log("controllerTests.ts");
    var outputPannel = document.getElementById("testOutput");
    outputPannel.innerHTML = "";
    testButtons.forEach(function (test) {
        TrackAsserts.value = true;
        var container = document.createElement("div");
        outputPannel.appendChild(container);
        test();
        if (TrackAsserts.value) {
            container.classList.add("test-pass");
        }
        else {
            container.classList.add("test-fail");
        }
        container.innerHTML = "testButtons." + test.name;
    });
};

},{"./controller":1,"./view":4}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2hpcHlhcmQyL2NvbnRyb2xsZXIudHMiLCJzcmMvc2hpcHlhcmQyL2NvbnRyb2xsZXJUZXN0cy50cyIsInNyYy9zaGlweWFyZDIvbW9kZWwudHMiLCJzcmMvc2hpcHlhcmQyL3ZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUEsK0NBQStDOztBQVMvQztJQWFFLG9CQUFZLEtBQVksRUFBRSxLQUFpQixFQUFFLE1BQU87UUFBcEQsaUJBbUJDO1FBMUJPLGlCQUFZLEdBQUc7WUFDckIsT0FBTyxFQUFFLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLEVBQUM7WUFDcEQsTUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLEVBQUM7WUFDcEQsTUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLEVBQUM7WUFDcEQsU0FBUyxFQUFFLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFDO1NBQ3JDLENBQUM7UUFHQSxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFFLDJDQUEyQztRQUNoRSxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sSUFBSSxPQUFPLENBQUM7UUFDaEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7UUFFeEIsRUFBRSxDQUFBLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNULEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkIsQ0FB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aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgMjAxNyBkdW5jYW4gbGF3IChtcmR1bmtAZ21haWwuY29tKVxuXG5pbXBvcnQge01vZGVsfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHtWaWV3QmFzZX0gZnJvbSBcIi4vdmlld1wiO1xuXG5pbnRlcmZhY2UgSUNvbW1hbmQge1xuICBuYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBDb250cm9sbGVyIHtcbiAgcHJpdmF0ZSBjb21tYW5kczogSUNvbW1hbmRbXTtcbiAgcHJpdmF0ZSBjb21tYW5kUG9pbnRlcjogbnVtYmVyO1xuICBwcml2YXRlIHZpZXdzOiBWaWV3QmFzZVtdO1xuICBwcml2YXRlIG1vZGVsOiBNb2RlbDtcbiAgcHJpdmF0ZSBsb2dnZXI7XG4gIHByaXZhdGUgYnV0dG9uU3RhdGVzID0ge1xuICAgIGFkZExpbmU6IHtzdGF0ZTogZmFsc2UsIGNsZWFyOiBbXCJkZWxldGVcIiwgXCJtaXJyb3JcIl19LFxuICAgIGRlbGV0ZToge3N0YXRlOiBmYWxzZSwgY2xlYXI6IFtcImFkZExpbmVcIiwgXCJtaXJyb3JcIl19LFxuICAgIG1pcnJvcjoge3N0YXRlOiBmYWxzZSwgY2xlYXI6IFtcImFkZExpbmVcIiwgXCJkZWxldGVcIl19LFxuICAgIGFsbExheWVyczoge3N0YXRlOiBmYWxzZSwgY2xlYXI6IFtdfSxcbiAgfTtcblxuICBjb25zdHJ1Y3Rvcihtb2RlbDogTW9kZWwsIHZpZXdzOiBWaWV3QmFzZVtdLCBsb2dnZXI/KSB7XG4gICAgdGhpcy5tb2RlbCA9IG1vZGVsOyAgLy8gVE9ETyBDYW4gdGhpcyBiZSBhc3NpZ25lZCBhdXRvbWF0aWNhbGx5P1xuICAgIHRoaXMudmlld3MgPSB2aWV3cztcbiAgICB0aGlzLmxvZ2dlciA9IGxvZ2dlciB8fCBjb25zb2xlO1xuICAgIHRoaXMuY29tbWFuZHMgPSBbXTtcbiAgICB0aGlzLmNvbW1hbmRQb2ludGVyID0gMDtcblxuICAgIGlmKG1vZGVsKSB7XG4gICAgICBtb2RlbC5pbml0KHRoaXMpO1xuICAgIH1cblxuICAgIHZpZXdzLmZvckVhY2goKHZpZXcpID0+IHtcbiAgICAgIHZpZXcuaW5pdCh0aGlzKTtcbiAgICB9KTtcblxuICAgIHRoaXMudmlld3MuZm9yRWFjaCgodmlldykgPT4ge1xuICAgICAgdmlldy5zZXRCdXR0b25TdGF0ZShcInVuZG9cIiwgZmFsc2UpO1xuICAgICAgdmlldy5zZXRCdXR0b25TdGF0ZShcInJlZG9cIiwgdGhpcy5jb21tYW5kUG9pbnRlciA8IHRoaXMuY29tbWFuZHMubGVuZ3RoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBvbkJ1dHRvbkV2ZW50KGJ1dHRvbkxhYmVsOiBzdHJpbmcpIHtcbiAgICB0aGlzLmxvZ2dlci5sb2coYnV0dG9uTGFiZWwpO1xuXG4gICAgc3dpdGNoIChidXR0b25MYWJlbCkge1xuICAgICAgY2FzZSBcInVuZG9cIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwicmVkb1wiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJjbGVhclwiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJhZGRMaW5lXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImRlbGV0ZVwiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJtaXJyb3JcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiYWxsTGF5ZXJzXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImJhY2tncm91bmRcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwic2F2ZVwiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJsb2FkXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybihcIkludmFsaWQgYnV0dG9uTGFiZWw6XCIsIGJ1dHRvbkxhYmVsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZUJ1dHRvbihidXR0b25MYWJlbCk7XG4gIH1cblxuICBwdWJsaWMgdXBkYXRlQnV0dG9uKGJ1dHRvbkxhYmVsOiBzdHJpbmcpIHtcbiAgICBpZih0aGlzLmJ1dHRvblN0YXRlc1tidXR0b25MYWJlbF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gSnVzdCBhIHNpbXBsZSBub24tdG9nZ2xpbmcgcHVzaCBidXR0b24uXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5idXR0b25TdGF0ZXNbYnV0dG9uTGFiZWxdLnZhbHVlID1cbiAgICAgICF0aGlzLmJ1dHRvblN0YXRlc1tidXR0b25MYWJlbF0udmFsdWU7XG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLmJ1dHRvblN0YXRlc1tidXR0b25MYWJlbF0udmFsdWU7XG4gICAgdGhpcy52aWV3cy5mb3JFYWNoKCh2aWV3KSA9PiB7XG4gICAgICB2aWV3LnNldEJ1dHRvblZhbHVlKGJ1dHRvbkxhYmVsLCB2YWx1ZSk7XG4gICAgICB0aGlzLmJ1dHRvblN0YXRlc1tidXR0b25MYWJlbF0uY2xlYXIuZm9yRWFjaCgob3RoZXJCdXR0b25MYWJlbCkgPT4ge1xuICAgICAgICB0aGlzLmJ1dHRvblN0YXRlc1tvdGhlckJ1dHRvbkxhYmVsXS52YWx1ZSA9IGZhbHNlO1xuICAgICAgICB2aWV3LnNldEJ1dHRvblZhbHVlKG90aGVyQnV0dG9uTGFiZWwsIGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZWNvcmRDb21tYW5kKGNvbW1hbmQ6IElDb21tYW5kKSB7XG4gICAgdGhpcy5jb21tYW5kcy5wdXNoKGNvbW1hbmQpO1xuXG4gICAgdGhpcy52aWV3cy5mb3JFYWNoKCh2aWV3KSA9PiB7XG4gICAgICB2aWV3LnNldEJ1dHRvblN0YXRlKFwidW5kb1wiLCB0cnVlKTtcbiAgICAgIHZpZXcuc2V0QnV0dG9uU3RhdGUoXCJyZWRvXCIsIHRoaXMuY29tbWFuZFBvaW50ZXIgPCB0aGlzLmNvbW1hbmRzLmxlbmd0aCk7XG4gICAgfSk7XG4gIH1cbn1cbiIsIi8vIENvcHlyaWdodCAyMDE3IGR1bmNhbiBsYXcgKG1yZHVua0BnbWFpbC5jb20pXG5cbmltcG9ydCB7Q29udHJvbGxlcn0gZnJvbSBcIi4vY29udHJvbGxlclwiO1xuaW1wb3J0IHtWaWV3TW9ja30gZnJvbSBcIi4vdmlld1wiO1xuXG5jbGFzcyBMb2dnZXJNb2NrIHtcbiAgcHVibGljIGxhc3RMb2c7XG4gIHB1YmxpYyBsYXN0V2FybjtcblxuICBwdWJsaWMgbG9nKC4uLm91dHB1dCkge1xuICAgIGNvbnNvbGUubG9nKHRoaXMuY29uY2F0VmFyaWFibGVzKG91dHB1dCkpO1xuICAgIHRoaXMubGFzdExvZyA9IG91dHB1dDtcbiAgfVxuXG4gIHB1YmxpYyB3YXJuKC4uLm91dHB1dCkge1xuICAgIGNvbnNvbGUud2Fybih0aGlzLmNvbmNhdFZhcmlhYmxlcyhvdXRwdXQpKTtcbiAgICB0aGlzLmxhc3RXYXJuID0gb3V0cHV0O1xuICB9XG5cbiAgcHJpdmF0ZSBjb25jYXRWYXJpYWJsZXMoaW5wdXQpOiBzdHJpbmcge1xuICAgIGxldCBvdXRwdXQgPSBcIlwiO1xuICAgIGlucHV0LmZvckVhY2goKHBlcmFtaXRlcikgPT4ge1xuICAgICAgb3V0cHV0ICs9IFN0cmluZyhwZXJhbWl0ZXIpICsgXCIgXCI7XG4gICAgfSk7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxufVxuXG5jbGFzcyBUcmFja0Fzc2VydHMge1xuICBwdWJsaWMgc3RhdGljIHZhbHVlOiBib29sZWFuID0gdHJ1ZTtcblxuICBwdWJsaWMgc3RhdGljIGFzc2VydCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMudmFsdWUgPSB0aGlzLnZhbHVlICYmIHZhbHVlO1xuICAgIGNvbnNvbGUuYXNzZXJ0KHZhbHVlKTtcbiAgfVxufVxuXG5jb25zdCB0ZXN0QnV0dG9ucyA9IFtcbiAgZnVuY3Rpb24gdGVzdEludmFsaWRCdXR0b24oKSB7XG4gICAgY29uc3QgbW9kZWwgPSBudWxsO1xuICAgIGNvbnN0IHRvb2xiYXIxID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgdG9vbGJhcjIgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyTW9jaygpO1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQ29udHJvbGxlcihtb2RlbCwgW3Rvb2xiYXIxLCB0b29sYmFyMl0sIGxvZ2dlcik7XG5cbiAgICBjb25zdCBidXR0b25MYWJlbCA9IFwic29tZUludmFsaWRCdXR0b25cIjtcblxuICAgIC8vIFBlcmZvcm0gYWN0aW9uIHVuZGVyIHRlc3QuXG4gICAgdG9vbGJhcjEuc2ltdWxhdGVCdXR0b25QcmVzcyhidXR0b25MYWJlbCk7XG5cbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KGxvZ2dlci5sYXN0V2FyblswXSA9PT0gXCJJbnZhbGlkIGJ1dHRvbkxhYmVsOlwiICYmXG4gICAgICAgICAgICAgICAgICAgbG9nZ2VyLmxhc3RXYXJuWzFdID09PSBidXR0b25MYWJlbCk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMS5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWxdID09PSB1bmRlZmluZWQpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjIuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsXSA9PT0gdW5kZWZpbmVkKTtcbiAgfSxcblxuICBmdW5jdGlvbiB0ZXN0UmVndWxhckJ1dHRvbigpIHtcbiAgICBjb25zdCBtb2RlbCA9IG51bGw7XG4gICAgY29uc3QgdG9vbGJhcjEgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCB0b29sYmFyMiA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXJNb2NrKCk7XG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBDb250cm9sbGVyKG1vZGVsLCBbdG9vbGJhcjEsIHRvb2xiYXIyXSwgbG9nZ2VyKTtcblxuICAgIGNvbnN0IGJ1dHRvbkxhYmVsID0gXCJjbGVhclwiO1xuXG4gICAgLy8gUGVyZm9ybSBhY3Rpb24gdW5kZXIgdGVzdC5cbiAgICB0b29sYmFyMS5zaW11bGF0ZUJ1dHRvblByZXNzKGJ1dHRvbkxhYmVsKTtcblxuICAgIC8vIFNpbmNlIHRoaXMgYnV0dG9uIGRvZXMgbm90IHN0YXkgZGVwcmVzc2VkLFxuICAgIC8vIHRoZXJlIGlzIG5vdGhpbmcgdG8gdXBkYXRlIG9uIHRoZSB2aWV3IG9iamVjdC5cbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIxLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbF0gPT09IHVuZGVmaW5lZCk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMi5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWxdID09PSB1bmRlZmluZWQpO1xuICB9LFxuXG4gIGZ1bmN0aW9uIHRlc3RTaW5nbGVUb2dnbGVCdXR0b24oKSB7XG4gICAgY29uc3QgbW9kZWwgPSBudWxsO1xuICAgIGNvbnN0IHRvb2xiYXIxID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgdG9vbGJhcjIgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyTW9jaygpO1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQ29udHJvbGxlcihtb2RlbCwgW3Rvb2xiYXIxLCB0b29sYmFyMl0sIGxvZ2dlcik7XG5cbiAgICBjb25zdCBidXR0b25MYWJlbCA9IFwiYWxsTGF5ZXJzXCI7XG5cbiAgICAvLyBQZXJmb3JtIGFjdGlvbiB1bmRlciB0ZXN0LlxuICAgIHRvb2xiYXIxLnNpbXVsYXRlQnV0dG9uUHJlc3MoYnV0dG9uTGFiZWwpO1xuXG4gICAgLy8gVGhpcyBidXR0b24gc3RheXMgZGVwcmVzc2VkIHNvIGl0IHNob3VsZCB1cGRhdGUgdGhlIHZpZXdzLlxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjEuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsXSA9PT0gdHJ1ZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMi5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWxdID09PSB0cnVlKTtcblxuICAgIC8vIFBlcmZvcm0gYWN0aW9uIHVuZGVyIHRlc3QgYWdhaW4uXG4gICAgdG9vbGJhcjEuc2ltdWxhdGVCdXR0b25QcmVzcyhidXR0b25MYWJlbCk7XG5cbiAgICAvLyBTZWNvbmQgcHJlc3Mgc2hvdWxkIGNsZWFyIGJ1dHRvbi5cbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIxLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbF0gPT09IGZhbHNlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIyLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbF0gPT09IGZhbHNlKTtcbiAgfSxcblxuICBmdW5jdGlvbiB0ZXN0UGFpcmVkVG9nZ2xlQnV0dG9ucygpIHtcbiAgICBjb25zdCBtb2RlbCA9IG51bGw7XG4gICAgY29uc3QgdG9vbGJhcjEgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCB0b29sYmFyMiA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXJNb2NrKCk7XG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBDb250cm9sbGVyKG1vZGVsLCBbdG9vbGJhcjEsIHRvb2xiYXIyXSwgbG9nZ2VyKTtcblxuICAgIC8vIE9ubHkgb25lIG9mIHRoZXNlIGJ1dHRvbnMgY2FuIGJlIHRvZ2dsZWQgYXQgb25jZS5cbiAgICBjb25zdCBidXR0b25MYWJlbDEgPSBcImFkZExpbmVcIjtcbiAgICBjb25zdCBidXR0b25MYWJlbDIgPSBcImRlbGV0ZVwiO1xuICAgIGNvbnN0IGJ1dHRvbkxhYmVsMyA9IFwibWlycm9yXCI7XG5cbiAgICAvLyBQZXJmb3JtIGFjdGlvbiB1bmRlciB0ZXN0LlxuICAgIHRvb2xiYXIxLnNpbXVsYXRlQnV0dG9uUHJlc3MoYnV0dG9uTGFiZWwxKTtcblxuICAgIC8vIFRoaXMgYnV0dG9uIHN0YXlzIGRlcHJlc3NlZCBzbyBpdCBzaG91bGQgdXBkYXRlIHRoZSB2aWV3cy5cbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIxLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbDFdID09PSB0cnVlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIyLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbDFdID09PSB0cnVlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIxLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbDJdID09PSBmYWxzZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMi5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWwyXSA9PT0gZmFsc2UpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjEuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsM10gPT09IGZhbHNlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIyLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbDNdID09PSBmYWxzZSk7XG5cbiAgICAvLyBQZXJmb3JtIGFjdGlvbiB1bmRlciB0ZXN0IGFnYWluLlxuICAgIHRvb2xiYXIxLnNpbXVsYXRlQnV0dG9uUHJlc3MoYnV0dG9uTGFiZWwxKTtcblxuICAgIC8vIFNlY29uZCBwcmVzcyBzaG91bGQgY2xlYXIgYnV0dG9uLlxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjEuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsMV0gPT09IGZhbHNlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIyLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbDFdID09PSBmYWxzZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMS5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWwyXSA9PT0gZmFsc2UpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjIuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsMl0gPT09IGZhbHNlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIxLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbDNdID09PSBmYWxzZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMi5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWwzXSA9PT0gZmFsc2UpO1xuXG4gICAgLy8gUGVyZm9ybSBhY3Rpb24gdW5kZXIgdGVzdCBhZ2Fpbi5cbiAgICAvLyBTZXQgb25lIGJ1dHRvbiB0aGVuIHNldCBhIGRpZmZlcmVudCBidXR0b24uXG4gICAgdG9vbGJhcjEuc2ltdWxhdGVCdXR0b25QcmVzcyhidXR0b25MYWJlbDEpO1xuICAgIHRvb2xiYXIxLnNpbXVsYXRlQnV0dG9uUHJlc3MoYnV0dG9uTGFiZWwyKTtcblxuICAgIC8vIERpZmZlcmVudCBidXR0b24gcHJlc3Mgc2hvdWxkIGNsZWFyIGJ1dHRvbkxhYmVsMS5cbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIxLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbDFdID09PSBmYWxzZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMi5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWwxXSA9PT0gZmFsc2UpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjEuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsMl0gPT09IHRydWUpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjIuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsMl0gPT09IHRydWUpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjEuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsM10gPT09IGZhbHNlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIyLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbDNdID09PSBmYWxzZSk7XG4gIH0sXG5dO1xuXG53aW5kb3cub25sb2FkID0gKCkgPT4ge1xuICBjb25zb2xlLmxvZyhcImNvbnRyb2xsZXJUZXN0cy50c1wiKTtcbiAgY29uc3Qgb3V0cHV0UGFubmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0ZXN0T3V0cHV0XCIpO1xuICBvdXRwdXRQYW5uZWwuaW5uZXJIVE1MID0gXCJcIjtcblxuICB0ZXN0QnV0dG9ucy5mb3JFYWNoKCh0ZXN0KSA9PiB7XG4gICAgVHJhY2tBc3NlcnRzLnZhbHVlID0gdHJ1ZTtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIG91dHB1dFBhbm5lbC5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICAgIHRlc3QoKTtcbiAgICBpZihUcmFja0Fzc2VydHMudmFsdWUpIHtcbiAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFwidGVzdC1wYXNzXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250YWluZXIuY2xhc3NMaXN0LmFkZChcInRlc3QtZmFpbFwiKTtcbiAgICB9XG4gICAgY29udGFpbmVyLmlubmVySFRNTCA9IFwidGVzdEJ1dHRvbnMuXCIgKyB0ZXN0Lm5hbWU7XG4gIH0pO1xufTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IGR1bmNhbiBsYXcgKG1yZHVua0BnbWFpbC5jb20pXG5cbmltcG9ydCB7Q29udHJvbGxlcn0gZnJvbSBcIi4vY29udHJvbGxlclwiO1xuXG5leHBvcnQgY2xhc3MgTW9kZWwge1xuICBwcml2YXRlIGNvbnRyb2xsZXI6IENvbnRyb2xsZXI7XG4gIHByaXZhdGUgZGF0YSA9IHtcbiAgICBzaGlwOiB7fSxcbiAgfTtcblxuICBwdWJsaWMgaW5pdChjb250cm9sbGVyOiBDb250cm9sbGVyKSB7XG4gICAgdGhpcy5jb250cm9sbGVyID0gY29udHJvbGxlcjtcbiAgfVxufVxuIiwiLy8gQ29weXJpZ2h0IDIwMTcgZHVuY2FuIGxhdyAobXJkdW5rQGdtYWlsLmNvbSlcblxuLy8gaW1wb3J0ICogYXMgS29udmEgZnJvbSBcImtvbnZhXCI7XG5pbXBvcnQge0NvbnRyb2xsZXJ9IGZyb20gXCIuL2NvbnRyb2xsZXJcIjtcblxuZXhwb3J0IGNsYXNzIFZpZXdCYXNlIHtcbiAgcHJvdGVjdGVkIGNvbnRyb2xsZXI6IENvbnRyb2xsZXI7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLy9cbiAgfVxuXG4gIHB1YmxpYyBpbml0KGNvbnRyb2xsZXI6IENvbnRyb2xsZXIpIHtcbiAgICB0aGlzLmNvbnRyb2xsZXIgPSBjb250cm9sbGVyO1xuICB9XG5cbiAgcHVibGljIHNldEJ1dHRvblZhbHVlKGJ1dHRvbkxhYmVsOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuKSB7XG4gICAgLy9cbiAgfVxuXG4gIHB1YmxpYyBzZXRCdXR0b25TdGF0ZShidXR0b25MYWJlbDogc3RyaW5nLCBzdGF0ZTogYm9vbGVhbikge1xuICAgIC8vXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFZpZXdNb2NrIGV4dGVuZHMgVmlld0Jhc2Uge1xuICBwdWJsaWMgYnV0dG9uVmFsdWVzID0ge307XG4gIHB1YmxpYyBidXR0b25TdGF0ZXMgPSB7fTtcblxuICBwdWJsaWMgc2V0QnV0dG9uVmFsdWUoYnV0dG9uTGFiZWw6IHN0cmluZywgdmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbF0gPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRCdXR0b25TdGF0ZShidXR0b25MYWJlbDogc3RyaW5nLCBzdGF0ZTogYm9vbGVhbikge1xuICAgIHRoaXMuYnV0dG9uU3RhdGVzW2J1dHRvbkxhYmVsXSA9IHN0YXRlO1xuICB9XG5cbiAgcHVibGljIHNpbXVsYXRlQnV0dG9uUHJlc3MoYnV0dG9uTGFiZWw6IHN0cmluZykge1xuICAgIHRoaXMuY29udHJvbGxlci5vbkJ1dHRvbkV2ZW50KGJ1dHRvbkxhYmVsKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVmlld1Rvb2xiYXIgZXh0ZW5kcyBWaWV3QmFzZSB7XG4gIHByaXZhdGUgYnV0dG9uRWxlbWVudHM6IEVsZW1lbnRbXTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIGNvbnNvbGUubG9nKFwiVmlld1Rvb2xiYXIoKVwiKTtcblxuICAgIHRoaXMuYnV0dG9uRWxlbWVudHMgPVxuICAgICAgW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLnB1cmUtYnV0dG9uXCIpKTtcbiAgICB0aGlzLmJ1dHRvbkVsZW1lbnRzLmZvckVhY2goKGJ1dHRvbikgPT4ge1xuICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLm9uQ2xpY2suYmluZCh0aGlzKSk7XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgc2V0QnV0dG9uVmFsdWUoYnV0dG9uTGFiZWw6IHN0cmluZywgdmFsdWU6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBidXR0b24gPSB0aGlzLmdldEJ1dHRvbkJ5TGFiZWwoYnV0dG9uTGFiZWwpO1xuICAgIGlmKGJ1dHRvbikge1xuICAgICAgaWYodmFsdWUpIHtcbiAgICAgICAgYnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJwdXJlLWJ1dHRvbi1hY3RpdmVcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBidXR0b24uY2xhc3NMaXN0LnJlbW92ZShcInB1cmUtYnV0dG9uLWFjdGl2ZVwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwdWJsaWMgc2V0QnV0dG9uU3RhdGUoYnV0dG9uTGFiZWw6IHN0cmluZywgc3RhdGU6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBidXR0b24gPSB0aGlzLmdldEJ1dHRvbkJ5TGFiZWwoYnV0dG9uTGFiZWwpO1xuICAgIGlmKGJ1dHRvbikge1xuICAgICAgaWYoc3RhdGUpIHtcbiAgICAgICAgYnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJwdXJlLWJ1dHRvbi1kaXNhYmxlZFwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwicHVyZS1idXR0b24tZGlzYWJsZWRcIik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvbkNsaWNrKGV2ZW50OiBFdmVudCkge1xuICAgIGNvbnN0IGJ1dHRvbiA9IGV2ZW50LmN1cnJlbnRUYXJnZXQgYXMgRWxlbWVudDtcbiAgICBjb25zdCBidXR0b25MYWJlbCA9IGJ1dHRvbi5nZXRBdHRyaWJ1dGUoXCJsYWJlbFwiKTtcbiAgICB0aGlzLmNvbnRyb2xsZXIub25CdXR0b25FdmVudChidXR0b25MYWJlbCk7XG4gIH1cblxuICBwcml2YXRlIGdldEJ1dHRvbkJ5TGFiZWwoYnV0dG9uTGFiZWw6IHN0cmluZyk6IEVsZW1lbnQge1xuICAgIGxldCByZXR1cm5CdXR0b246IEVsZW1lbnQ7XG4gICAgdGhpcy5idXR0b25FbGVtZW50cy5mb3JFYWNoKChidXR0b24pID0+IHtcbiAgICAgIGlmKGJ1dHRvbkxhYmVsID09PSBidXR0b24uZ2V0QXR0cmlidXRlKFwibGFiZWxcIikpIHtcbiAgICAgICAgcmV0dXJuQnV0dG9uID0gYnV0dG9uO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXR1cm5CdXR0b247XG4gIH1cbn1cbiJdfQ==
