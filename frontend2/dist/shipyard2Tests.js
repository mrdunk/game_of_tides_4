(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
// Copyright 2017 duncan law (mrdunk@gmail.com)
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.LoggerMock = LoggerMock;
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
exports.TrackAsserts = TrackAsserts;

},{}],2:[function(require,module,exports){
"use strict";
// Copyright 2017 duncan law (mrdunk@gmail.com)
Object.defineProperty(exports, "__esModule", { value: true });
var Controller = (function () {
    function Controller(model, views, logger) {
        var _this = this;
        this.idGenerator = 0;
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
    Controller.prototype.onLineEvent = function (lineEvent) {
        if (!lineEvent.startPos && !lineEvent.finishPos) {
            this.logger.warn("No startPos or finishPos for line: ", lineEvent.id);
            return;
        }
        if (lineEvent.startPos &&
            (!lineEvent.startPos.a || !lineEvent.startPos.b)) {
            this.logger.warn("Missing endpoint for startPos of line: ", lineEvent.id);
            return;
        }
        if (lineEvent.finishPos &&
            (!lineEvent.finishPos.a || !lineEvent.finishPos.b)) {
            this.logger.warn("Missing endpoint for endPos of line: ", lineEvent.id);
            return;
        }
        if (!lineEvent.id) {
            if (lineEvent.startPos) {
                this.logger.warn("No id specified for line being moved or deleted.");
                return;
            }
            // No id and no lineEvent.startPos implies this is a new line.
            lineEvent.id = "line_" + this.idGenerator;
            this.idGenerator++;
        }
        var command = {
            lineEvents: [lineEvent],
        };
        this.recordCommand(command);
        this.model.onLineEvent(lineEvent);
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

},{}],3:[function(require,module,exports){
"use strict";
// Copyright 2017 duncan law (mrdunk@gmail.com)
Object.defineProperty(exports, "__esModule", { value: true });
var commonFunctionstTests_1 = require("./commonFunctionstTests");
var controller_1 = require("./controller");
var model_1 = require("./model");
var view_1 = require("./view");
exports.controllerButtonEventTests = {
    testInvalidButton: function () {
        var model = null;
        var toolbar1 = new view_1.ViewMock();
        var toolbar2 = new view_1.ViewMock();
        var logger = new commonFunctionstTests_1.LoggerMock();
        var controller = new controller_1.Controller(model, [toolbar1, toolbar2], logger);
        var buttonLabel = "someInvalidButton";
        // Perform action under test.
        toolbar1.simulateButtonPress(buttonLabel);
        commonFunctionstTests_1.TrackAsserts.assert(logger.lastWarn[0] === "Invalid buttonLabel:" &&
            logger.lastWarn[1] === buttonLabel);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar1.buttonValues[buttonLabel] === undefined);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar2.buttonValues[buttonLabel] === undefined);
    },
    testRegularButton: function () {
        var model = null;
        var toolbar1 = new view_1.ViewMock();
        var toolbar2 = new view_1.ViewMock();
        var logger = new commonFunctionstTests_1.LoggerMock();
        var controller = new controller_1.Controller(model, [toolbar1, toolbar2], logger);
        var buttonLabel = "clear";
        // Perform action under test.
        toolbar1.simulateButtonPress(buttonLabel);
        // Since this button does not stay depressed,
        // there is nothing to update on the view object.
        commonFunctionstTests_1.TrackAsserts.assert(toolbar1.buttonValues[buttonLabel] === undefined);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar2.buttonValues[buttonLabel] === undefined);
    },
    testSingleToggleButton: function () {
        var model = null;
        var toolbar1 = new view_1.ViewMock();
        var toolbar2 = new view_1.ViewMock();
        var logger = new commonFunctionstTests_1.LoggerMock();
        var controller = new controller_1.Controller(model, [toolbar1, toolbar2], logger);
        var buttonLabel = "allLayers";
        // Perform action under test.
        toolbar1.simulateButtonPress(buttonLabel);
        // This button stays depressed so it should update the views.
        commonFunctionstTests_1.TrackAsserts.assert(toolbar1.buttonValues[buttonLabel] === true);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar2.buttonValues[buttonLabel] === true);
        // Perform action under test again.
        toolbar1.simulateButtonPress(buttonLabel);
        // Second press should clear button.
        commonFunctionstTests_1.TrackAsserts.assert(toolbar1.buttonValues[buttonLabel] === false);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar2.buttonValues[buttonLabel] === false);
    },
    testPairedToggleButtons: function () {
        var model = null;
        var toolbar1 = new view_1.ViewMock();
        var toolbar2 = new view_1.ViewMock();
        var logger = new commonFunctionstTests_1.LoggerMock();
        var controller = new controller_1.Controller(model, [toolbar1, toolbar2], logger);
        // Only one of these buttons can be toggled at once.
        var buttonLabel1 = "addLine";
        var buttonLabel2 = "delete";
        var buttonLabel3 = "mirror";
        // Perform action under test.
        toolbar1.simulateButtonPress(buttonLabel1);
        // This button stays depressed so it should update the views.
        commonFunctionstTests_1.TrackAsserts.assert(toolbar1.buttonValues[buttonLabel1] === true);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar2.buttonValues[buttonLabel1] === true);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar1.buttonValues[buttonLabel2] === false);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar2.buttonValues[buttonLabel2] === false);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar1.buttonValues[buttonLabel3] === false);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar2.buttonValues[buttonLabel3] === false);
        // Perform action under test again.
        toolbar1.simulateButtonPress(buttonLabel1);
        // Second press should clear button.
        commonFunctionstTests_1.TrackAsserts.assert(toolbar1.buttonValues[buttonLabel1] === false);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar2.buttonValues[buttonLabel1] === false);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar1.buttonValues[buttonLabel2] === false);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar2.buttonValues[buttonLabel2] === false);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar1.buttonValues[buttonLabel3] === false);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar2.buttonValues[buttonLabel3] === false);
        // Perform action under test again.
        // Set one button then set a different button.
        toolbar1.simulateButtonPress(buttonLabel1);
        toolbar1.simulateButtonPress(buttonLabel2);
        // Different button press should clear buttonLabel1.
        commonFunctionstTests_1.TrackAsserts.assert(toolbar1.buttonValues[buttonLabel1] === false);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar2.buttonValues[buttonLabel1] === false);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar1.buttonValues[buttonLabel2] === true);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar2.buttonValues[buttonLabel2] === true);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar1.buttonValues[buttonLabel3] === false);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar2.buttonValues[buttonLabel3] === false);
    },
};
exports.controllerLineEventTests = {
    testNewInvalidLine: function () {
        var model = new model_1.ModelMock();
        var widget1 = new view_1.ViewMock();
        var widget2 = new view_1.ViewMock();
        var toolbar = new view_1.ViewMock();
        var logger = new commonFunctionstTests_1.LoggerMock();
        var controller = new controller_1.Controller(model, [widget1, widget2, toolbar], logger);
        // Perform action under test.
        widget1.simulateLineEvent(null, null, null);
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 0);
        commonFunctionstTests_1.TrackAsserts.assert(logger.lastWarn[0] === "No startPos or finishPos for line: " &&
            logger.lastWarn[1] === null);
    },
    testNewInvalidLineMissingPoint: function () {
        var model = new model_1.ModelMock();
        var widget1 = new view_1.ViewMock();
        var widget2 = new view_1.ViewMock();
        var toolbar = new view_1.ViewMock();
        var logger = new commonFunctionstTests_1.LoggerMock();
        var controller = new controller_1.Controller(model, [widget1, widget2, toolbar], logger);
        var linePos = {
            a: { x: 1, y: 2, z: 3 },
            b: null,
        };
        // Perform action under test.
        widget1.simulateLineEvent(null, linePos, null);
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 0);
        commonFunctionstTests_1.TrackAsserts.assert(logger.lastWarn[0] === "Missing endpoint for startPos of line: " &&
            logger.lastWarn[1] === null);
        // Perform action under test again.
        widget1.simulateLineEvent(null, null, linePos);
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 0);
        commonFunctionstTests_1.TrackAsserts.assert(logger.lastWarn[0] === "Missing endpoint for endPos of line: " &&
            logger.lastWarn[1] === null);
    },
    testNewInvalidLineNoIdOnMove: function () {
        var model = new model_1.ModelMock();
        var widget1 = new view_1.ViewMock();
        var widget2 = new view_1.ViewMock();
        var toolbar = new view_1.ViewMock();
        var logger = new commonFunctionstTests_1.LoggerMock();
        var controller = new controller_1.Controller(model, [widget1, widget2, toolbar], logger);
        var linePosStart = {
            a: { x: 1, y: 2, z: 3 },
            b: { x: 11, y: 22, z: 33 },
        };
        var linePosFinish = {
            a: { x: 4, y: 5, z: 6 },
            b: { x: 44, y: 55, z: 66 },
        };
        // Perform action under test.
        widget1.simulateLineEvent(null, linePosStart, linePosFinish);
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 0);
        commonFunctionstTests_1.TrackAsserts.assert(logger.lastWarn[0] ===
            "No id specified for line being moved or deleted.");
    },
};

},{"./commonFunctionstTests":1,"./controller":2,"./model":5,"./view":6}],4:[function(require,module,exports){
"use strict";
// Copyright 2017 duncan law (mrdunk@gmail.com)
Object.defineProperty(exports, "__esModule", { value: true });
var commonFunctionstTests_1 = require("./commonFunctionstTests");
var controllerTests_1 = require("./controllerTests");
window.onload = function () {
    console.log("mainTests.ts");
    var outputPannel = document.getElementById("testOutput");
    outputPannel.innerHTML = "";
    var testSuites = {
        controllerButtonEventTests: controllerTests_1.controllerButtonEventTests,
        controllerLineEventTests: controllerTests_1.controllerLineEventTests,
    };
    for (var testSuiteName in testSuites) {
        if (!testSuites.hasOwnProperty(testSuiteName)) {
            continue;
        }
        var testSuite = testSuites[testSuiteName];
        for (var testName in testSuite) {
            if (!testSuite.hasOwnProperty(testName)) {
                continue;
            }
            var test = testSuite[testName];
            commonFunctionstTests_1.TrackAsserts.value = true;
            var container = document.createElement("div");
            outputPannel.appendChild(container);
            test();
            if (commonFunctionstTests_1.TrackAsserts.value) {
                container.classList.add("test-pass");
            }
            else {
                container.classList.add("test-fail");
            }
            container.innerHTML = testSuiteName + "." + test.name;
        }
    }
};

},{"./commonFunctionstTests":1,"./controllerTests":3}],5:[function(require,module,exports){
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
var ModelBase = (function () {
    function ModelBase() {
    }
    ModelBase.prototype.init = function (controller) {
        this.controller = controller;
    };
    return ModelBase;
}());
exports.ModelBase = ModelBase;
var Model = (function (_super) {
    __extends(Model, _super);
    function Model() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.data = {
            ship: {},
        };
        return _this;
    }
    Model.prototype.onLineEvent = function (event) {
        // TODO.
    };
    return Model;
}(ModelBase));
exports.Model = Model;
var ModelMock = (function (_super) {
    __extends(ModelMock, _super);
    function ModelMock() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.lineEvents = [];
        return _this;
    }
    ModelMock.prototype.onLineEvent = function (event) {
        this.lineEvents.push(event);
    };
    return ModelMock;
}(ModelBase));
exports.ModelMock = ModelMock;

},{}],6:[function(require,module,exports){
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
    ViewMock.prototype.simulateLineEvent = function (id, startPos, finishPos) {
        var event = {
            id: id,
            startPos: startPos,
            finishPos: finishPos,
        };
        this.controller.onLineEvent(event);
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

},{}]},{},[1,2,3,4,5,6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2hpcHlhcmQyL2NvbW1vbkZ1bmN0aW9uc3RUZXN0cy50cyIsInNyYy9zaGlweWFyZDIvY29udHJvbGxlci50cyIsInNyYy9zaGlweWFyZDIvY29udHJvbGxlclRlc3RzLnRzIiwic3JjL3NoaXB5YXJkMi9tYWluVGVzdHMudHMiLCJzcmMvc2hpcHlhcmQyL21vZGVsLnRzIiwic3JjL3NoaXB5YXJkMi92aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBLCtDQUErQzs7QUFFL0M7SUFBQTtJQXFCQSxDQUFDO0lBakJRLHdCQUFHLEdBQVY7UUFBVyxnQkFBUzthQUFULFVBQVMsRUFBVCxxQkFBUyxFQUFULElBQVM7WUFBVCwyQkFBUzs7UUFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7SUFDeEIsQ0FBQztJQUVNLHlCQUFJLEdBQVg7UUFBWSxnQkFBUzthQUFULFVBQVMsRUFBVCxxQkFBUyxFQUFULElBQVM7WUFBVCwyQkFBUzs7UUFDbkIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUM7SUFDekIsQ0FBQztJQUVPLG9DQUFlLEdBQXZCLFVBQXdCLEtBQUs7UUFDM0IsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBQyxTQUFTO1lBQ3RCLE1BQU0sSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQ3BDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBQ0gsaUJBQUM7QUFBRCxD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LFVBQWdCLEtBQVk7UUFDMUIsSUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLGFBQXdCLENBQUM7UUFDOUMsSUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRU8sc0NBQWdCLEdBQXhCLFVBQXlCLFdBQW1CO1FBQzFDLElBQUksWUFBcUIsQ0FBQztRQUMxQixJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxVQUFDLE1BQU07WUFDakMsRUFBRSxDQUFBLENBQUMsV0FBVyxLQUFLLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCxZQUFZLEdBQUcsTUFBTSxDQUFDO1lBQ3hCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxZQUFZLENBQUM7SUFDdEIsQ0FBQztJQUNILGtCQUFDO0FBQUQsQ0FuREEsQUFtREMsQ0FuRGdDLFFBQVEsR0FtRHhDO0FBbkRZLGtDQUFXIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCAyMDE3IGR1bmNhbiBsYXcgKG1yZHVua0BnbWFpbC5jb20pXG5cbmV4cG9ydCBjbGFzcyBMb2dnZXJNb2NrIHtcbiAgcHVibGljIGxhc3RMb2c7XG4gIHB1YmxpYyBsYXN0V2FybjtcblxuICBwdWJsaWMgbG9nKC4uLm91dHB1dCkge1xuICAgIGNvbnNvbGUubG9nKHRoaXMuY29uY2F0VmFyaWFibGVzKG91dHB1dCkpO1xuICAgIHRoaXMubGFzdExvZyA9IG91dHB1dDtcbiAgfVxuXG4gIHB1YmxpYyB3YXJuKC4uLm91dHB1dCkge1xuICAgIGNvbnNvbGUud2Fybih0aGlzLmNvbmNhdFZhcmlhYmxlcyhvdXRwdXQpKTtcbiAgICB0aGlzLmxhc3RXYXJuID0gb3V0cHV0O1xuICB9XG5cbiAgcHJpdmF0ZSBjb25jYXRWYXJpYWJsZXMoaW5wdXQpOiBzdHJpbmcge1xuICAgIGxldCBvdXRwdXQgPSBcIlwiO1xuICAgIGlucHV0LmZvckVhY2goKHBlcmFtaXRlcikgPT4ge1xuICAgICAgb3V0cHV0ICs9IFN0cmluZyhwZXJhbWl0ZXIpICsgXCIgXCI7XG4gICAgfSk7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVHJhY2tBc3NlcnRzIHtcbiAgcHVibGljIHN0YXRpYyB2YWx1ZTogYm9vbGVhbiA9IHRydWU7XG5cbiAgcHVibGljIHN0YXRpYyBhc3NlcnQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLnZhbHVlID0gdGhpcy52YWx1ZSAmJiB2YWx1ZTtcbiAgICBjb25zb2xlLmFzc2VydCh2YWx1ZSk7XG4gIH1cbn1cblxuXG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBkdW5jYW4gbGF3IChtcmR1bmtAZ21haWwuY29tKVxuXG5pbXBvcnQge01vZGVsQmFzZX0gZnJvbSBcIi4vbW9kZWxcIjtcbmltcG9ydCB7Vmlld0Jhc2V9IGZyb20gXCIuL3ZpZXdcIjtcblxuaW50ZXJmYWNlIElDb21tYW5kIHtcbiAgbGluZUV2ZW50czogSUxpbmVFdmVudFtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElQb2ludCB7XG4gIHg6IG51bWJlcjsgIC8vIFBvcnQvU3RhcmJvcmQgYXhpcy5cbiAgeTogbnVtYmVyOyAgLy8gVXAvRG93biBheGlzLlxuICB6OiBudW1iZXI7ICAvLyBGb3JlL0FmdCBheGlzLlxufVxuXG5leHBvcnQgaW50ZXJmYWNlIElMaW5lUG9zIHtcbiAgYTogSVBvaW50O1xuICBiOiBJUG9pbnQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUxpbmVFdmVudCB7XG4gIGlkOiBzdHJpbmc7XG4gIHN0YXJ0UG9zOiBJTGluZVBvcztcbiAgZmluaXNoUG9zOiBJTGluZVBvcztcbn1cblxuZXhwb3J0IGNsYXNzIENvbnRyb2xsZXIge1xuICBwcml2YXRlIGlkR2VuZXJhdG9yOiBudW1iZXIgPSAwO1xuICBwcml2YXRlIGNvbW1hbmRzOiBJQ29tbWFuZFtdO1xuICBwcml2YXRlIGNvbW1hbmRQb2ludGVyOiBudW1iZXI7XG4gIHByaXZhdGUgdmlld3M6IFZpZXdCYXNlW107XG4gIHByaXZhdGUgbW9kZWw6IE1vZGVsQmFzZTtcbiAgcHJpdmF0ZSBsb2dnZXI7XG4gIHByaXZhdGUgYnV0dG9uU3RhdGVzID0ge1xuICAgIGFkZExpbmU6IHtzdGF0ZTogZmFsc2UsIGNsZWFyOiBbXCJkZWxldGVcIiwgXCJtaXJyb3JcIl19LFxuICAgIGRlbGV0ZToge3N0YXRlOiBmYWxzZSwgY2xlYXI6IFtcImFkZExpbmVcIiwgXCJtaXJyb3JcIl19LFxuICAgIG1pcnJvcjoge3N0YXRlOiBmYWxzZSwgY2xlYXI6IFtcImFkZExpbmVcIiwgXCJkZWxldGVcIl19LFxuICAgIGFsbExheWVyczoge3N0YXRlOiBmYWxzZSwgY2xlYXI6IFtdfSxcbiAgfTtcblxuICBjb25zdHJ1Y3Rvcihtb2RlbDogTW9kZWxCYXNlLCB2aWV3czogVmlld0Jhc2VbXSwgbG9nZ2VyPykge1xuICAgIHRoaXMubW9kZWwgPSBtb2RlbDsgIC8vIFRPRE8gQ2FuIHRoaXMgYmUgYXNzaWduZWQgYXV0b21hdGljYWxseT9cbiAgICB0aGlzLnZpZXdzID0gdmlld3M7XG4gICAgdGhpcy5sb2dnZXIgPSBsb2dnZXIgfHwgY29uc29sZTtcbiAgICB0aGlzLmNvbW1hbmRzID0gW107XG4gICAgdGhpcy5jb21tYW5kUG9pbnRlciA9IDA7XG5cbiAgICBpZihtb2RlbCkge1xuICAgICAgbW9kZWwuaW5pdCh0aGlzKTtcbiAgICB9XG5cbiAgICB2aWV3cy5mb3JFYWNoKCh2aWV3KSA9PiB7XG4gICAgICB2aWV3LmluaXQodGhpcyk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnZpZXdzLmZvckVhY2goKHZpZXcpID0+IHtcbiAgICAgIHZpZXcuc2V0QnV0dG9uU3RhdGUoXCJ1bmRvXCIsIGZhbHNlKTtcbiAgICAgIHZpZXcuc2V0QnV0dG9uU3RhdGUoXCJyZWRvXCIsIHRoaXMuY29tbWFuZFBvaW50ZXIgPCB0aGlzLmNvbW1hbmRzLmxlbmd0aCk7XG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgb25CdXR0b25FdmVudChidXR0b25MYWJlbDogc3RyaW5nKSB7XG4gICAgdGhpcy5sb2dnZXIubG9nKGJ1dHRvbkxhYmVsKTtcblxuICAgIHN3aXRjaCAoYnV0dG9uTGFiZWwpIHtcbiAgICAgIGNhc2UgXCJ1bmRvXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcInJlZG9cIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiY2xlYXJcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiYWRkTGluZVwiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJkZWxldGVcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwibWlycm9yXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFsbExheWVyc1wiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJiYWNrZ3JvdW5kXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcInNhdmVcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwibG9hZFwiOlxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oXCJJbnZhbGlkIGJ1dHRvbkxhYmVsOlwiLCBidXR0b25MYWJlbCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVCdXR0b24oYnV0dG9uTGFiZWwpO1xuICB9XG5cbiAgcHVibGljIG9uTGluZUV2ZW50KGxpbmVFdmVudDogSUxpbmVFdmVudCkge1xuICAgIGlmKCFsaW5lRXZlbnQuc3RhcnRQb3MgJiYgIWxpbmVFdmVudC5maW5pc2hQb3MpIHtcbiAgICAgIHRoaXMubG9nZ2VyLndhcm4oXCJObyBzdGFydFBvcyBvciBmaW5pc2hQb3MgZm9yIGxpbmU6IFwiLCBsaW5lRXZlbnQuaWQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmKGxpbmVFdmVudC5zdGFydFBvcyAmJlxuICAgICAgICghbGluZUV2ZW50LnN0YXJ0UG9zLmEgfHwgIWxpbmVFdmVudC5zdGFydFBvcy5iKSkge1xuICAgICAgdGhpcy5sb2dnZXIud2FybihcbiAgICAgICAgXCJNaXNzaW5nIGVuZHBvaW50IGZvciBzdGFydFBvcyBvZiBsaW5lOiBcIiwgbGluZUV2ZW50LmlkKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYobGluZUV2ZW50LmZpbmlzaFBvcyAmJlxuICAgICAgICghbGluZUV2ZW50LmZpbmlzaFBvcy5hIHx8ICFsaW5lRXZlbnQuZmluaXNoUG9zLmIpKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKFxuICAgICAgICBcIk1pc3NpbmcgZW5kcG9pbnQgZm9yIGVuZFBvcyBvZiBsaW5lOiBcIiwgbGluZUV2ZW50LmlkKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZighbGluZUV2ZW50LmlkKSB7XG4gICAgICBpZihsaW5lRXZlbnQuc3RhcnRQb3MpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIud2FybihcbiAgICAgICAgICBcIk5vIGlkIHNwZWNpZmllZCBmb3IgbGluZSBiZWluZyBtb3ZlZCBvciBkZWxldGVkLlwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy8gTm8gaWQgYW5kIG5vIGxpbmVFdmVudC5zdGFydFBvcyBpbXBsaWVzIHRoaXMgaXMgYSBuZXcgbGluZS5cbiAgICAgIGxpbmVFdmVudC5pZCA9IFwibGluZV9cIiArIHRoaXMuaWRHZW5lcmF0b3I7XG4gICAgICB0aGlzLmlkR2VuZXJhdG9yKys7XG4gICAgfVxuXG4gICAgY29uc3QgY29tbWFuZDogSUNvbW1hbmQgPSB7XG4gICAgICBsaW5lRXZlbnRzOiBbbGluZUV2ZW50XSxcbiAgICB9O1xuICAgIHRoaXMucmVjb3JkQ29tbWFuZChjb21tYW5kKTtcbiAgICB0aGlzLm1vZGVsLm9uTGluZUV2ZW50KGxpbmVFdmVudCk7XG4gIH1cblxuICBwdWJsaWMgdXBkYXRlQnV0dG9uKGJ1dHRvbkxhYmVsOiBzdHJpbmcpIHtcbiAgICBpZih0aGlzLmJ1dHRvblN0YXRlc1tidXR0b25MYWJlbF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gSnVzdCBhIHNpbXBsZSBub24tdG9nZ2xpbmcgcHVzaCBidXR0b24uXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5idXR0b25TdGF0ZXNbYnV0dG9uTGFiZWxdLnZhbHVlID1cbiAgICAgICF0aGlzLmJ1dHRvblN0YXRlc1tidXR0b25MYWJlbF0udmFsdWU7XG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLmJ1dHRvblN0YXRlc1tidXR0b25MYWJlbF0udmFsdWU7XG4gICAgdGhpcy52aWV3cy5mb3JFYWNoKCh2aWV3KSA9PiB7XG4gICAgICB2aWV3LnNldEJ1dHRvblZhbHVlKGJ1dHRvbkxhYmVsLCB2YWx1ZSk7XG4gICAgICB0aGlzLmJ1dHRvblN0YXRlc1tidXR0b25MYWJlbF0uY2xlYXIuZm9yRWFjaCgob3RoZXJCdXR0b25MYWJlbCkgPT4ge1xuICAgICAgICB0aGlzLmJ1dHRvblN0YXRlc1tvdGhlckJ1dHRvbkxhYmVsXS52YWx1ZSA9IGZhbHNlO1xuICAgICAgICB2aWV3LnNldEJ1dHRvblZhbHVlKG90aGVyQnV0dG9uTGFiZWwsIGZhbHNlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZWNvcmRDb21tYW5kKGNvbW1hbmQ6IElDb21tYW5kKSB7XG4gICAgdGhpcy5jb21tYW5kcy5wdXNoKGNvbW1hbmQpO1xuXG4gICAgdGhpcy52aWV3cy5mb3JFYWNoKCh2aWV3KSA9PiB7XG4gICAgICB2aWV3LnNldEJ1dHRvblN0YXRlKFwidW5kb1wiLCB0cnVlKTtcbiAgICAgIHZpZXcuc2V0QnV0dG9uU3RhdGUoXCJyZWRvXCIsIHRoaXMuY29tbWFuZFBvaW50ZXIgPCB0aGlzLmNvbW1hbmRzLmxlbmd0aCk7XG4gICAgfSk7XG4gIH1cbn1cbiIsIi8vIENvcHlyaWdodCAyMDE3IGR1bmNhbiBsYXcgKG1yZHVua0BnbWFpbC5jb20pXG5cbmltcG9ydCB7TG9nZ2VyTW9jaywgVHJhY2tBc3NlcnRzfSBmcm9tIFwiLi9jb21tb25GdW5jdGlvbnN0VGVzdHNcIjtcbmltcG9ydCB7Q29udHJvbGxlciwgSUxpbmVFdmVudCwgSUxpbmVQb3MsIElQb2ludH0gZnJvbSBcIi4vY29udHJvbGxlclwiO1xuaW1wb3J0IHtNb2RlbE1vY2t9IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQge1ZpZXdNb2NrfSBmcm9tIFwiLi92aWV3XCI7XG5cbmV4cG9ydCBjb25zdCBjb250cm9sbGVyQnV0dG9uRXZlbnRUZXN0cyA9IHtcbiAgdGVzdEludmFsaWRCdXR0b246ICgpID0+IHtcbiAgICBjb25zdCBtb2RlbCA9IG51bGw7XG4gICAgY29uc3QgdG9vbGJhcjEgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCB0b29sYmFyMiA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXJNb2NrKCk7XG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBDb250cm9sbGVyKG1vZGVsLCBbdG9vbGJhcjEsIHRvb2xiYXIyXSwgbG9nZ2VyKTtcblxuICAgIGNvbnN0IGJ1dHRvbkxhYmVsID0gXCJzb21lSW52YWxpZEJ1dHRvblwiO1xuXG4gICAgLy8gUGVyZm9ybSBhY3Rpb24gdW5kZXIgdGVzdC5cbiAgICB0b29sYmFyMS5zaW11bGF0ZUJ1dHRvblByZXNzKGJ1dHRvbkxhYmVsKTtcblxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQobG9nZ2VyLmxhc3RXYXJuWzBdID09PSBcIkludmFsaWQgYnV0dG9uTGFiZWw6XCIgJiZcbiAgICAgICAgICAgICAgICAgICBsb2dnZXIubGFzdFdhcm5bMV0gPT09IGJ1dHRvbkxhYmVsKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIxLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbF0gPT09IHVuZGVmaW5lZCk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMi5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWxdID09PSB1bmRlZmluZWQpO1xuICB9LFxuXG4gIHRlc3RSZWd1bGFyQnV0dG9uOiAoKSA9PiB7XG4gICAgY29uc3QgbW9kZWwgPSBudWxsO1xuICAgIGNvbnN0IHRvb2xiYXIxID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgdG9vbGJhcjIgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyTW9jaygpO1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQ29udHJvbGxlcihtb2RlbCwgW3Rvb2xiYXIxLCB0b29sYmFyMl0sIGxvZ2dlcik7XG5cbiAgICBjb25zdCBidXR0b25MYWJlbCA9IFwiY2xlYXJcIjtcblxuICAgIC8vIFBlcmZvcm0gYWN0aW9uIHVuZGVyIHRlc3QuXG4gICAgdG9vbGJhcjEuc2ltdWxhdGVCdXR0b25QcmVzcyhidXR0b25MYWJlbCk7XG5cbiAgICAvLyBTaW5jZSB0aGlzIGJ1dHRvbiBkb2VzIG5vdCBzdGF5IGRlcHJlc3NlZCxcbiAgICAvLyB0aGVyZSBpcyBub3RoaW5nIHRvIHVwZGF0ZSBvbiB0aGUgdmlldyBvYmplY3QuXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMS5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWxdID09PSB1bmRlZmluZWQpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjIuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsXSA9PT0gdW5kZWZpbmVkKTtcbiAgfSxcblxuICB0ZXN0U2luZ2xlVG9nZ2xlQnV0dG9uOiAoKSA9PiB7XG4gICAgY29uc3QgbW9kZWwgPSBudWxsO1xuICAgIGNvbnN0IHRvb2xiYXIxID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgdG9vbGJhcjIgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyTW9jaygpO1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQ29udHJvbGxlcihtb2RlbCwgW3Rvb2xiYXIxLCB0b29sYmFyMl0sIGxvZ2dlcik7XG5cbiAgICBjb25zdCBidXR0b25MYWJlbCA9IFwiYWxsTGF5ZXJzXCI7XG5cbiAgICAvLyBQZXJmb3JtIGFjdGlvbiB1bmRlciB0ZXN0LlxuICAgIHRvb2xiYXIxLnNpbXVsYXRlQnV0dG9uUHJlc3MoYnV0dG9uTGFiZWwpO1xuXG4gICAgLy8gVGhpcyBidXR0b24gc3RheXMgZGVwcmVzc2VkIHNvIGl0IHNob3VsZCB1cGRhdGUgdGhlIHZpZXdzLlxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjEuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsXSA9PT0gdHJ1ZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMi5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWxdID09PSB0cnVlKTtcblxuICAgIC8vIFBlcmZvcm0gYWN0aW9uIHVuZGVyIHRlc3QgYWdhaW4uXG4gICAgdG9vbGJhcjEuc2ltdWxhdGVCdXR0b25QcmVzcyhidXR0b25MYWJlbCk7XG5cbiAgICAvLyBTZWNvbmQgcHJlc3Mgc2hvdWxkIGNsZWFyIGJ1dHRvbi5cbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIxLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbF0gPT09IGZhbHNlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIyLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbF0gPT09IGZhbHNlKTtcbiAgfSxcblxuICB0ZXN0UGFpcmVkVG9nZ2xlQnV0dG9uczogKCkgPT4ge1xuICAgIGNvbnN0IG1vZGVsID0gbnVsbDtcbiAgICBjb25zdCB0b29sYmFyMSA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IHRvb2xiYXIyID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlck1vY2soKTtcbiAgICBjb25zdCBjb250cm9sbGVyID0gbmV3IENvbnRyb2xsZXIobW9kZWwsIFt0b29sYmFyMSwgdG9vbGJhcjJdLCBsb2dnZXIpO1xuXG4gICAgLy8gT25seSBvbmUgb2YgdGhlc2UgYnV0dG9ucyBjYW4gYmUgdG9nZ2xlZCBhdCBvbmNlLlxuICAgIGNvbnN0IGJ1dHRvbkxhYmVsMSA9IFwiYWRkTGluZVwiO1xuICAgIGNvbnN0IGJ1dHRvbkxhYmVsMiA9IFwiZGVsZXRlXCI7XG4gICAgY29uc3QgYnV0dG9uTGFiZWwzID0gXCJtaXJyb3JcIjtcblxuICAgIC8vIFBlcmZvcm0gYWN0aW9uIHVuZGVyIHRlc3QuXG4gICAgdG9vbGJhcjEuc2ltdWxhdGVCdXR0b25QcmVzcyhidXR0b25MYWJlbDEpO1xuXG4gICAgLy8gVGhpcyBidXR0b24gc3RheXMgZGVwcmVzc2VkIHNvIGl0IHNob3VsZCB1cGRhdGUgdGhlIHZpZXdzLlxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjEuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsMV0gPT09IHRydWUpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjIuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsMV0gPT09IHRydWUpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjEuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsMl0gPT09IGZhbHNlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIyLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbDJdID09PSBmYWxzZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMS5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWwzXSA9PT0gZmFsc2UpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjIuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsM10gPT09IGZhbHNlKTtcblxuICAgIC8vIFBlcmZvcm0gYWN0aW9uIHVuZGVyIHRlc3QgYWdhaW4uXG4gICAgdG9vbGJhcjEuc2ltdWxhdGVCdXR0b25QcmVzcyhidXR0b25MYWJlbDEpO1xuXG4gICAgLy8gU2Vjb25kIHByZXNzIHNob3VsZCBjbGVhciBidXR0b24uXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMS5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWwxXSA9PT0gZmFsc2UpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjIuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsMV0gPT09IGZhbHNlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIxLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbDJdID09PSBmYWxzZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMi5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWwyXSA9PT0gZmFsc2UpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjEuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsM10gPT09IGZhbHNlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIyLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbDNdID09PSBmYWxzZSk7XG5cbiAgICAvLyBQZXJmb3JtIGFjdGlvbiB1bmRlciB0ZXN0IGFnYWluLlxuICAgIC8vIFNldCBvbmUgYnV0dG9uIHRoZW4gc2V0IGEgZGlmZmVyZW50IGJ1dHRvbi5cbiAgICB0b29sYmFyMS5zaW11bGF0ZUJ1dHRvblByZXNzKGJ1dHRvbkxhYmVsMSk7XG4gICAgdG9vbGJhcjEuc2ltdWxhdGVCdXR0b25QcmVzcyhidXR0b25MYWJlbDIpO1xuXG4gICAgLy8gRGlmZmVyZW50IGJ1dHRvbiBwcmVzcyBzaG91bGQgY2xlYXIgYnV0dG9uTGFiZWwxLlxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjEuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsMV0gPT09IGZhbHNlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIyLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbDFdID09PSBmYWxzZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMS5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWwyXSA9PT0gdHJ1ZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMi5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWwyXSA9PT0gdHJ1ZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMS5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWwzXSA9PT0gZmFsc2UpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjIuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsM10gPT09IGZhbHNlKTtcbiAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBjb250cm9sbGVyTGluZUV2ZW50VGVzdHMgPSB7XG4gIHRlc3ROZXdJbnZhbGlkTGluZTogKCkgPT4ge1xuICAgIGNvbnN0IG1vZGVsID0gbmV3IE1vZGVsTW9jaygpO1xuICAgIGNvbnN0IHdpZGdldDEgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCB3aWRnZXQyID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgdG9vbGJhciA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXJNb2NrKCk7XG4gICAgY29uc3QgY29udHJvbGxlciA9XG4gICAgICBuZXcgQ29udHJvbGxlcihtb2RlbCwgW3dpZGdldDEsIHdpZGdldDIsIHRvb2xiYXJdLCBsb2dnZXIpO1xuXG4gICAgLy8gUGVyZm9ybSBhY3Rpb24gdW5kZXIgdGVzdC5cbiAgICB3aWRnZXQxLnNpbXVsYXRlTGluZUV2ZW50KG51bGwsIG51bGwsIG51bGwpO1xuXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChtb2RlbC5saW5lRXZlbnRzLmxlbmd0aCA9PT0gMCk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChcbiAgICAgIGxvZ2dlci5sYXN0V2FyblswXSA9PT0gXCJObyBzdGFydFBvcyBvciBmaW5pc2hQb3MgZm9yIGxpbmU6IFwiICYmXG4gICAgICBsb2dnZXIubGFzdFdhcm5bMV0gPT09IG51bGwpO1xuICB9LFxuXG4gIHRlc3ROZXdJbnZhbGlkTGluZU1pc3NpbmdQb2ludDogKCkgPT4ge1xuICAgIGNvbnN0IG1vZGVsID0gbmV3IE1vZGVsTW9jaygpO1xuICAgIGNvbnN0IHdpZGdldDEgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCB3aWRnZXQyID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgdG9vbGJhciA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXJNb2NrKCk7XG4gICAgY29uc3QgY29udHJvbGxlciA9XG4gICAgICBuZXcgQ29udHJvbGxlcihtb2RlbCwgW3dpZGdldDEsIHdpZGdldDIsIHRvb2xiYXJdLCBsb2dnZXIpO1xuXG4gICAgY29uc3QgbGluZVBvczogSUxpbmVQb3MgPSB7XG4gICAgICBhOiB7eDoxLCB5OjIsIHo6M30sXG4gICAgICBiOiBudWxsLFxuICAgIH07XG5cbiAgICAvLyBQZXJmb3JtIGFjdGlvbiB1bmRlciB0ZXN0LlxuICAgIHdpZGdldDEuc2ltdWxhdGVMaW5lRXZlbnQobnVsbCwgbGluZVBvcywgbnVsbCk7XG5cbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KG1vZGVsLmxpbmVFdmVudHMubGVuZ3RoID09PSAwKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KFxuICAgICAgbG9nZ2VyLmxhc3RXYXJuWzBdID09PSBcIk1pc3NpbmcgZW5kcG9pbnQgZm9yIHN0YXJ0UG9zIG9mIGxpbmU6IFwiICYmXG4gICAgICBsb2dnZXIubGFzdFdhcm5bMV0gPT09IG51bGwpO1xuXG4gICAgLy8gUGVyZm9ybSBhY3Rpb24gdW5kZXIgdGVzdCBhZ2Fpbi5cbiAgICB3aWRnZXQxLnNpbXVsYXRlTGluZUV2ZW50KG51bGwsIG51bGwsIGxpbmVQb3MpO1xuXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChtb2RlbC5saW5lRXZlbnRzLmxlbmd0aCA9PT0gMCk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChcbiAgICAgIGxvZ2dlci5sYXN0V2FyblswXSA9PT0gXCJNaXNzaW5nIGVuZHBvaW50IGZvciBlbmRQb3Mgb2YgbGluZTogXCIgJiZcbiAgICAgIGxvZ2dlci5sYXN0V2FyblsxXSA9PT0gbnVsbCk7XG4gIH0sXG4gIFxuICB0ZXN0TmV3SW52YWxpZExpbmVOb0lkT25Nb3ZlOiAoKSA9PiB7XG4gICAgY29uc3QgbW9kZWwgPSBuZXcgTW9kZWxNb2NrKCk7XG4gICAgY29uc3Qgd2lkZ2V0MSA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IHdpZGdldDIgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCB0b29sYmFyID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlck1vY2soKTtcbiAgICBjb25zdCBjb250cm9sbGVyID1cbiAgICAgIG5ldyBDb250cm9sbGVyKG1vZGVsLCBbd2lkZ2V0MSwgd2lkZ2V0MiwgdG9vbGJhcl0sIGxvZ2dlcik7XG5cbiAgICBjb25zdCBsaW5lUG9zU3RhcnQ6IElMaW5lUG9zID0ge1xuICAgICAgYToge3g6MSwgeToyLCB6OjN9LFxuICAgICAgYjoge3g6MTEsIHk6MjIsIHo6MzN9LFxuICAgIH07XG5cbiAgICBjb25zdCBsaW5lUG9zRmluaXNoOiBJTGluZVBvcyA9IHtcbiAgICAgIGE6IHt4OjQsIHk6NSwgejo2fSxcbiAgICAgIGI6IHt4OjQ0LCB5OjU1LCB6OjY2fSxcbiAgICB9O1xuXG4gICAgLy8gUGVyZm9ybSBhY3Rpb24gdW5kZXIgdGVzdC5cbiAgICB3aWRnZXQxLnNpbXVsYXRlTGluZUV2ZW50KG51bGwsIGxpbmVQb3NTdGFydCwgbGluZVBvc0ZpbmlzaCk7XG5cbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KG1vZGVsLmxpbmVFdmVudHMubGVuZ3RoID09PSAwKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KGxvZ2dlci5sYXN0V2FyblswXSA9PT1cbiAgICAgIFwiTm8gaWQgc3BlY2lmaWVkIGZvciBsaW5lIGJlaW5nIG1vdmVkIG9yIGRlbGV0ZWQuXCIpO1xuICB9LFxuXG59O1xuXG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBkdW5jYW4gbGF3IChtcmR1bmtAZ21haWwuY29tKVxuXG5pbXBvcnQge1RyYWNrQXNzZXJ0c30gZnJvbSBcIi4vY29tbW9uRnVuY3Rpb25zdFRlc3RzXCI7XG5pbXBvcnQge2NvbnRyb2xsZXJCdXR0b25FdmVudFRlc3RzLFxuICAgICAgICBjb250cm9sbGVyTGluZUV2ZW50VGVzdHN9IGZyb20gXCIuL2NvbnRyb2xsZXJUZXN0c1wiO1xuXG5cbndpbmRvdy5vbmxvYWQgPSAoKSA9PiB7XG4gIGNvbnNvbGUubG9nKFwibWFpblRlc3RzLnRzXCIpO1xuICBjb25zdCBvdXRwdXRQYW5uZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRlc3RPdXRwdXRcIik7XG4gIG91dHB1dFBhbm5lbC5pbm5lckhUTUwgPSBcIlwiO1xuXG4gIGNvbnN0IHRlc3RTdWl0ZXMgPSB7XG4gICAgY29udHJvbGxlckJ1dHRvbkV2ZW50VGVzdHMsXG4gICAgY29udHJvbGxlckxpbmVFdmVudFRlc3RzLFxuICB9O1xuXG4gIGZvcihjb25zdCB0ZXN0U3VpdGVOYW1lIGluIHRlc3RTdWl0ZXMpIHtcbiAgICBpZighdGVzdFN1aXRlcy5oYXNPd25Qcm9wZXJ0eSh0ZXN0U3VpdGVOYW1lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IHRlc3RTdWl0ZSA9IHRlc3RTdWl0ZXNbdGVzdFN1aXRlTmFtZV07XG5cbiAgICBmb3IoY29uc3QgdGVzdE5hbWUgaW4gdGVzdFN1aXRlKSB7XG4gICAgICBpZighdGVzdFN1aXRlLmhhc093blByb3BlcnR5KHRlc3ROYW1lKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRlc3QgPSB0ZXN0U3VpdGVbdGVzdE5hbWVdO1xuXG4gICAgICBUcmFja0Fzc2VydHMudmFsdWUgPSB0cnVlO1xuICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIG91dHB1dFBhbm5lbC5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICAgICAgdGVzdCgpO1xuICAgICAgaWYoVHJhY2tBc3NlcnRzLnZhbHVlKSB7XG4gICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFwidGVzdC1wYXNzXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoXCJ0ZXN0LWZhaWxcIik7XG4gICAgICB9XG4gICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gdGVzdFN1aXRlTmFtZSArIFwiLlwiICsgdGVzdC5uYW1lO1xuICAgIH1cbiAgfVxufTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IGR1bmNhbiBsYXcgKG1yZHVua0BnbWFpbC5jb20pXG5cbmltcG9ydCB7Q29udHJvbGxlciwgSUxpbmVFdmVudH0gZnJvbSBcIi4vY29udHJvbGxlclwiO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTW9kZWxCYXNlIHtcbiAgcHJpdmF0ZSBjb250cm9sbGVyOiBDb250cm9sbGVyO1xuICBwdWJsaWMgaW5pdChjb250cm9sbGVyOiBDb250cm9sbGVyKSB7XG4gICAgdGhpcy5jb250cm9sbGVyID0gY29udHJvbGxlcjtcbiAgfVxuXG4gIHB1YmxpYyBhYnN0cmFjdCBvbkxpbmVFdmVudChldmVudCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBNb2RlbCBleHRlbmRzIE1vZGVsQmFzZSB7XG4gIHByaXZhdGUgZGF0YSA9IHtcbiAgICBzaGlwOiB7fSxcbiAgfTtcblxuICBwdWJsaWMgb25MaW5lRXZlbnQoZXZlbnQpIHtcbiAgICAvLyBUT0RPLlxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBNb2RlbE1vY2sgZXh0ZW5kcyBNb2RlbEJhc2Uge1xuICBwdWJsaWMgbGluZUV2ZW50czogW0lMaW5lRXZlbnRdID0gKFtdIGFzIFtJTGluZUV2ZW50XSk7XG5cbiAgcHVibGljIG9uTGluZUV2ZW50KGV2ZW50OiBJTGluZUV2ZW50KSB7XG4gICAgdGhpcy5saW5lRXZlbnRzLnB1c2goZXZlbnQpO1xuICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBkdW5jYW4gbGF3IChtcmR1bmtAZ21haWwuY29tKVxuXG4vLyBpbXBvcnQgKiBhcyBLb252YSBmcm9tIFwia29udmFcIjtcbmltcG9ydCB7Q29udHJvbGxlciwgSUxpbmVFdmVudCwgSUxpbmVQb3N9IGZyb20gXCIuL2NvbnRyb2xsZXJcIjtcblxuZXhwb3J0IGNsYXNzIFZpZXdCYXNlIHtcbiAgcHJvdGVjdGVkIGNvbnRyb2xsZXI6IENvbnRyb2xsZXI7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLy9cbiAgfVxuXG4gIHB1YmxpYyBpbml0KGNvbnRyb2xsZXI6IENvbnRyb2xsZXIpIHtcbiAgICB0aGlzLmNvbnRyb2xsZXIgPSBjb250cm9sbGVyO1xuICB9XG5cbiAgcHVibGljIHNldEJ1dHRvblZhbHVlKGJ1dHRvbkxhYmVsOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuKSB7XG4gICAgLy9cbiAgfVxuXG4gIHB1YmxpYyBzZXRCdXR0b25TdGF0ZShidXR0b25MYWJlbDogc3RyaW5nLCBzdGF0ZTogYm9vbGVhbikge1xuICAgIC8vXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFZpZXdNb2NrIGV4dGVuZHMgVmlld0Jhc2Uge1xuICBwdWJsaWMgYnV0dG9uVmFsdWVzID0ge307XG4gIHB1YmxpYyBidXR0b25TdGF0ZXMgPSB7fTtcblxuICBwdWJsaWMgc2V0QnV0dG9uVmFsdWUoYnV0dG9uTGFiZWw6IHN0cmluZywgdmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbF0gPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRCdXR0b25TdGF0ZShidXR0b25MYWJlbDogc3RyaW5nLCBzdGF0ZTogYm9vbGVhbikge1xuICAgIHRoaXMuYnV0dG9uU3RhdGVzW2J1dHRvbkxhYmVsXSA9IHN0YXRlO1xuICB9XG5cbiAgcHVibGljIHNpbXVsYXRlQnV0dG9uUHJlc3MoYnV0dG9uTGFiZWw6IHN0cmluZykge1xuICAgIHRoaXMuY29udHJvbGxlci5vbkJ1dHRvbkV2ZW50KGJ1dHRvbkxhYmVsKTtcbiAgfVxuXG4gIHB1YmxpYyBzaW11bGF0ZUxpbmVFdmVudChpZDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRQb3M6IElMaW5lUG9zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZmluaXNoUG9zOiBJTGluZVBvcykge1xuICAgIGNvbnN0IGV2ZW50OiBJTGluZUV2ZW50ID0ge1xuICAgICAgaWQsXG4gICAgICBzdGFydFBvcyxcbiAgICAgIGZpbmlzaFBvcyxcbiAgICB9O1xuICAgIHRoaXMuY29udHJvbGxlci5vbkxpbmVFdmVudChldmVudCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFZpZXdUb29sYmFyIGV4dGVuZHMgVmlld0Jhc2Uge1xuICBwcml2YXRlIGJ1dHRvbkVsZW1lbnRzOiBFbGVtZW50W107XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICBjb25zb2xlLmxvZyhcIlZpZXdUb29sYmFyKClcIik7XG5cbiAgICB0aGlzLmJ1dHRvbkVsZW1lbnRzID1cbiAgICAgIFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5wdXJlLWJ1dHRvblwiKSk7XG4gICAgdGhpcy5idXR0b25FbGVtZW50cy5mb3JFYWNoKChidXR0b24pID0+IHtcbiAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5vbkNsaWNrLmJpbmQodGhpcykpO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIHNldEJ1dHRvblZhbHVlKGJ1dHRvbkxhYmVsOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuKSB7XG4gICAgY29uc3QgYnV0dG9uID0gdGhpcy5nZXRCdXR0b25CeUxhYmVsKGJ1dHRvbkxhYmVsKTtcbiAgICBpZihidXR0b24pIHtcbiAgICAgIGlmKHZhbHVlKSB7XG4gICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwicHVyZS1idXR0b24tYWN0aXZlXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJwdXJlLWJ1dHRvbi1hY3RpdmVcIik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHVibGljIHNldEJ1dHRvblN0YXRlKGJ1dHRvbkxhYmVsOiBzdHJpbmcsIHN0YXRlOiBib29sZWFuKSB7XG4gICAgY29uc3QgYnV0dG9uID0gdGhpcy5nZXRCdXR0b25CeUxhYmVsKGJ1dHRvbkxhYmVsKTtcbiAgICBpZihidXR0b24pIHtcbiAgICAgIGlmKHN0YXRlKSB7XG4gICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwicHVyZS1idXR0b24tZGlzYWJsZWRcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBidXR0b24uY2xhc3NMaXN0LmFkZChcInB1cmUtYnV0dG9uLWRpc2FibGVkXCIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25DbGljayhldmVudDogRXZlbnQpIHtcbiAgICBjb25zdCBidXR0b24gPSBldmVudC5jdXJyZW50VGFyZ2V0IGFzIEVsZW1lbnQ7XG4gICAgY29uc3QgYnV0dG9uTGFiZWwgPSBidXR0b24uZ2V0QXR0cmlidXRlKFwibGFiZWxcIik7XG4gICAgdGhpcy5jb250cm9sbGVyLm9uQnV0dG9uRXZlbnQoYnV0dG9uTGFiZWwpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRCdXR0b25CeUxhYmVsKGJ1dHRvbkxhYmVsOiBzdHJpbmcpOiBFbGVtZW50IHtcbiAgICBsZXQgcmV0dXJuQnV0dG9uOiBFbGVtZW50O1xuICAgIHRoaXMuYnV0dG9uRWxlbWVudHMuZm9yRWFjaCgoYnV0dG9uKSA9PiB7XG4gICAgICBpZihidXR0b25MYWJlbCA9PT0gYnV0dG9uLmdldEF0dHJpYnV0ZShcImxhYmVsXCIpKSB7XG4gICAgICAgIHJldHVybkJ1dHRvbiA9IGJ1dHRvbjtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmV0dXJuQnV0dG9uO1xuICB9XG59XG4iXX0=
