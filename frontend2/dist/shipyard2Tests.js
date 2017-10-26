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
function comparePoint(p1, p2) {
    return (p1.x === p2.x && p1.y === p2.y && p1.z === p2.z);
}
exports.comparePoint = comparePoint;
function compareLinePos(lp1, lp2) {
    if (lp1 === null || lp2 === null) {
        return (lp1 === lp2);
    }
    return (comparePoint(lp1.a, lp2.a) && comparePoint(lp1.b, lp2.b));
}
exports.compareLinePos = compareLinePos;
function compareLineEvent(e1, e2) {
    return (e1.id === e2.id &&
        compareLinePos(e1.startPos, e2.startPos) &&
        compareLinePos(e1.finishPos, e2.finishPos));
}
exports.compareLineEvent = compareLineEvent;
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
        this.setButtonStates();
    }
    Controller.prototype.onButtonEvent = function (buttonLabel) {
        this.logger.log(buttonLabel);
        switch (buttonLabel) {
            case "undo":
                this.undoCommand();
                break;
            case "redo":
                this.performCommand();
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
        this.performCommand();
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
    // Set whether the "back" and "forward" buttons are selectable.
    Controller.prototype.setButtonStates = function () {
        var _this = this;
        this.views.forEach(function (view) {
            view.setButtonState("undo", _this.commandPointer > 0);
            view.setButtonState("redo", _this.commandPointer < _this.commands.length);
        });
    };
    Controller.prototype.recordCommand = function (command) {
        this.commands = this.commands.slice(0, this.commandPointer);
        this.commands.push(command);
    };
    Controller.prototype.performCommand = function (commandIndex) {
        var _this = this;
        if (commandIndex === undefined) {
            commandIndex = this.commandPointer;
        }
        if (commandIndex >= this.commands.length || commandIndex < 0) {
            this.logger.warn("Trying to performCommand past end of buffer. index:", commandIndex);
            return;
        }
        var command = this.commands[commandIndex];
        command.lineEvents.forEach(function (lineEvent) {
            _this.model.onLineEvent(lineEvent);
        });
        this.commandPointer++;
        this.setButtonStates();
    };
    Controller.prototype.undoCommand = function (commandIndex) {
        var _this = this;
        this.commandPointer--;
        if (commandIndex === undefined) {
            commandIndex = this.commandPointer;
        }
        if (commandIndex >= this.commands.length || commandIndex < 0) {
            this.logger.warn("Trying to performCommand past end of buffer. index:", commandIndex);
            this.commandPointer = 0;
            return;
        }
        var command = this.commands[commandIndex];
        command.lineEvents.forEach(function (lineEvent) {
            var reverseLineEvent = {
                id: lineEvent.id,
                startPos: JSON.parse(JSON.stringify(lineEvent.finishPos)),
                finishPos: JSON.parse(JSON.stringify(lineEvent.startPos)),
            };
            _this.model.onLineEvent(reverseLineEvent);
        });
        this.setButtonStates();
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
    testMoveLine: function () {
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
        // Although this is moving a line that does not actually exist on the model,
        // it is not up to the controller to police this so the test passes.
        widget1.simulateLineEvent("someId", linePosStart, linePosFinish);
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 1);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.undo === true);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.redo === false);
    },
    testDeleteLine: function () {
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
        // Perform action under test.
        // Although this is deleting a line that does not actually exist on the
        // model, it is not up to the controller to police this so the test passes.
        widget1.simulateLineEvent("someId", linePosStart, null);
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 1);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.undo === true);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.redo === false);
    },
    testNewLine: function () {
        var model = new model_1.ModelMock();
        var widget1 = new view_1.ViewMock();
        var widget2 = new view_1.ViewMock();
        var toolbar = new view_1.ViewMock();
        var logger = new commonFunctionstTests_1.LoggerMock();
        var controller = new controller_1.Controller(model, [widget1, widget2, toolbar], logger);
        var linePosFinish = {
            a: { x: 4, y: 5, z: 6 },
            b: { x: 44, y: 55, z: 66 },
        };
        // Perform action under test.
        widget1.simulateLineEvent(null, null, linePosFinish);
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 1);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.undo === true);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.redo === false);
    },
    testMultipleNewLines: function () {
        var model = new model_1.ModelMock();
        var widget1 = new view_1.ViewMock();
        var widget2 = new view_1.ViewMock();
        var toolbar = new view_1.ViewMock();
        var logger = new commonFunctionstTests_1.LoggerMock();
        var controller = new controller_1.Controller(model, [widget1, widget2, toolbar], logger);
        var linePosFinish = {
            a: { x: 4, y: 5, z: 6 },
            b: { x: 44, y: 55, z: 66 },
        };
        // Add some lines.
        widget1.simulateLineEvent(null, null, linePosFinish);
        widget1.simulateLineEvent(null, null, linePosFinish);
        widget1.simulateLineEvent(null, null, linePosFinish);
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 3);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.undo === true);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.redo === false);
    },
};
exports.controllerCommandHistoryTests = {
    testUndoButton: function () {
        var model = new model_1.ModelMock();
        var widget1 = new view_1.ViewMock();
        var widget2 = new view_1.ViewMock();
        var toolbar = new view_1.ViewMock();
        var logger = new commonFunctionstTests_1.LoggerMock();
        var controller = new controller_1.Controller(model, [widget1, widget2, toolbar], logger);
        var linePosFinish = {
            a: { x: 4, y: 5, z: 6 },
            b: { x: 44, y: 55, z: 66 },
        };
        // Add some lines.
        widget1.simulateLineEvent(null, null, linePosFinish);
        widget1.simulateLineEvent(null, null, linePosFinish);
        widget1.simulateLineEvent(null, null, linePosFinish);
        // Confirm we are on track.
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 3);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.undo === true);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.redo === false);
        // Perform action under test.
        toolbar.simulateButtonPress("undo");
        // Confirm we are on track.
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 4);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.undo === true);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.redo === true);
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents[2].id === model.lineEvents[3].id);
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[2].startPos, model.lineEvents[3].finishPos));
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[2].finishPos, model.lineEvents[3].startPos));
        // Perform action under test. Undo back to the start.
        toolbar.simulateButtonPress("undo");
        toolbar.simulateButtonPress("undo");
        // Confirm we are on track.
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 6);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.undo === false);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.redo === true);
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents[1].id === model.lineEvents[4].id);
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[1].startPos, model.lineEvents[4].finishPos));
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[1].finishPos, model.lineEvents[4].startPos));
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents[0].id === model.lineEvents[5].id);
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[0].startPos, model.lineEvents[5].finishPos));
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[0].finishPos, model.lineEvents[5].startPos));
        // Perform action under test. Undo part start of buffer.
        toolbar.simulateButtonPress("undo");
        commonFunctionstTests_1.TrackAsserts.assert(logger.lastWarn[0] ===
            "Trying to performCommand past end of buffer. index:" &&
            logger.lastWarn[1] === -1);
        toolbar.simulateButtonPress("undo");
        commonFunctionstTests_1.TrackAsserts.assert(logger.lastWarn[0] ===
            "Trying to performCommand past end of buffer. index:" &&
            logger.lastWarn[1] === -1);
    },
    testRedoButton: function () {
        var model = new model_1.ModelMock();
        var widget1 = new view_1.ViewMock();
        var widget2 = new view_1.ViewMock();
        var toolbar = new view_1.ViewMock();
        var logger = new commonFunctionstTests_1.LoggerMock();
        var controller = new controller_1.Controller(model, [widget1, widget2, toolbar], logger);
        var linePosFinish = {
            a: { x: 4, y: 5, z: 6 },
            b: { x: 44, y: 55, z: 66 },
        };
        // Add some lines.
        widget1.simulateLineEvent(null, null, linePosFinish);
        widget1.simulateLineEvent(null, null, linePosFinish);
        widget1.simulateLineEvent(null, null, linePosFinish);
        // Confirm we are on track.
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 3);
        // Step back to the start of buffer.
        toolbar.simulateButtonPress("undo");
        toolbar.simulateButtonPress("undo");
        toolbar.simulateButtonPress("undo");
        // Confirm we are on track.
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 6);
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents[2].id === model.lineEvents[3].id);
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[2].startPos, model.lineEvents[3].finishPos));
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[2].finishPos, model.lineEvents[3].startPos));
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents[1].id === model.lineEvents[4].id);
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[1].startPos, model.lineEvents[4].finishPos));
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[1].finishPos, model.lineEvents[4].startPos));
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents[0].id === model.lineEvents[5].id);
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[0].startPos, model.lineEvents[5].finishPos));
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[0].finishPos, model.lineEvents[5].startPos));
        // Perform action under test.
        toolbar.simulateButtonPress("redo");
        toolbar.simulateButtonPress("redo");
        toolbar.simulateButtonPress("redo");
        // Confirm we are on track.
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 9);
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLineEvent(model.lineEvents[0], model.lineEvents[6]));
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLineEvent(model.lineEvents[1], model.lineEvents[7]));
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLineEvent(model.lineEvents[2], model.lineEvents[8]));
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.undo === true);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.redo === false);
        // Perform action under test. Try to redo past end of buffer.
        toolbar.simulateButtonPress("redo");
        commonFunctionstTests_1.TrackAsserts.assert(logger.lastWarn[0] ===
            "Trying to performCommand past end of buffer. index:" &&
            logger.lastWarn[1] === 3);
        toolbar.simulateButtonPress("redo");
        commonFunctionstTests_1.TrackAsserts.assert(logger.lastWarn[0] ===
            "Trying to performCommand past end of buffer. index:" &&
            logger.lastWarn[1] === 3);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.undo === true);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.redo === false);
    },
    testUndoButtonThenOverwrite: function () {
        var model = new model_1.ModelMock();
        var widget1 = new view_1.ViewMock();
        var widget2 = new view_1.ViewMock();
        var toolbar = new view_1.ViewMock();
        var logger = new commonFunctionstTests_1.LoggerMock();
        var controller = new controller_1.Controller(model, [widget1, widget2, toolbar], logger);
        var linePosFinish = {
            a: { x: 4, y: 5, z: 6 },
            b: { x: 44, y: 55, z: 66 },
        };
        // Add some lines.
        widget1.simulateLineEvent(null, null, linePosFinish);
        widget1.simulateLineEvent(null, null, linePosFinish);
        widget1.simulateLineEvent(null, null, linePosFinish);
        // Confirm we are on track.
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 3);
        // Step back to the start of buffer.
        toolbar.simulateButtonPress("undo");
        toolbar.simulateButtonPress("undo");
        toolbar.simulateButtonPress("undo");
        // Confirm we are on track.
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 6);
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents[2].id === model.lineEvents[3].id);
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[2].startPos, model.lineEvents[3].finishPos));
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[2].finishPos, model.lineEvents[3].startPos));
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents[1].id === model.lineEvents[4].id);
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[1].startPos, model.lineEvents[4].finishPos));
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[1].finishPos, model.lineEvents[4].startPos));
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents[0].id === model.lineEvents[5].id);
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[0].startPos, model.lineEvents[5].finishPos));
        commonFunctionstTests_1.TrackAsserts.assert(controller_1.compareLinePos(model.lineEvents[0].finishPos, model.lineEvents[5].startPos));
        // Perform action under test. Add another line.
        widget1.simulateLineEvent(null, null, linePosFinish);
        // Confirm we are on track.
        commonFunctionstTests_1.TrackAsserts.assert(model.lineEvents.length === 7);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.undo === true);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.redo === false);
        // Perform action under test. Try to redo past end of buffer.
        toolbar.simulateButtonPress("redo");
        commonFunctionstTests_1.TrackAsserts.assert(logger.lastWarn[0] ===
            "Trying to performCommand past end of buffer. index:" &&
            logger.lastWarn[1] === 1);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.undo === true);
        commonFunctionstTests_1.TrackAsserts.assert(toolbar.buttonStates.redo === false);
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
        controllerCommandHistoryTests: controllerTests_1.controllerCommandHistoryTests,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2hpcHlhcmQyL2NvbW1vbkZ1bmN0aW9uc3RUZXN0cy50cyIsInNyYy9zaGlweWFyZDIvY29udHJvbGxlci50cyIsInNyYy9zaGlweWFyZDIvY29udHJvbGxlclRlc3RzLnRzIiwic3JjL3NoaXB5YXJkMi9tYWluVGVzdHMudHMiLCJzcmMvc2hpcHlhcmQyL21vZGVsLnRzIiwic3JjL3NoaXB5YXJkMi92aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBLCtDQUErQzs7QUFFL0M7SUFBQTtJQXFCQSxDQUFDO0lBakJRLHdCQUFHLEdBQVY7UUFBVyxnQkFBUzthQUFULFVBQVMsRUFBVCxxQkFBUyxFQUFULElBQVM7WUFBVCwyQkFBUzs7UUFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7SUFDeEIsQ0FBQztJQUVNLHlCQUFJLEdBQVg7UUFBWSxnQkFBUzthQUFULFVBQVMsRUFBVCxxQkFBUyxFQUFULElBQVM7WUFBVCwyQkFBUzs7UUFDbkIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUM7SUFDekIsQ0FBQztJQUVPLG9DQUFlLEdBQXZCLFVBQXdCLEtBQUs7UUFDM0IsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBQyxTQUFTO1lBQ3RCLE1BQU0sSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQ3BDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBQ0gsaUJBQUM7QUFBRCxD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QyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN2RSxvQ0FBWSxDQUFDLE1BQU0sQ0FBQywyQkFBYyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUM1QixLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDbkUsb0NBQVksQ0FBQyxNQUFNLENBQUMsMkJBQWMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFDN0IsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBRWxFLG9DQUFZLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdkUsb0NBQVksQ0FBQyxNQUFNLENBQUMsMkJBQWMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFDNUIsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ25FLG9DQUFZLENBQUMsTUFBTSxDQUFDLDJCQUFjLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQzdCLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUVsRSxvQ0FBWSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FB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QUFDO0lBQ0gsQ0FBQztJQUVPLDZCQUFPLEdBQWYsVUFBZ0IsS0FBWTtRQUMxQixJQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsYUFBd0IsQ0FBQztRQUM5QyxJQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2pELElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFTyxzQ0FBZ0IsR0FBeEIsVUFBeUIsV0FBbUI7UUFDMUMsSUFBSSxZQUFxQixDQUFDO1FBQzFCLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLFVBQUMsTUFBTTtZQUNqQyxFQUFFLENBQUEsQ0FBQyxXQUFXLEtBQUssTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELFlBQVksR0FBRyxNQUFNLENBQUM7WUFDeEIsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxDQUFDLFlBQVksQ0FBQztJQUN0QixDQUFDO0lBQ0gsa0JBQUM7QUFBRCxDQW5EQSxBQW1EQyxDQW5EZ0MsUUFBUSxHQW1EeEM7QUFuRFksa0NBQVciLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQ29weXJpZ2h0IDIwMTcgZHVuY2FuIGxhdyAobXJkdW5rQGdtYWlsLmNvbSlcblxuZXhwb3J0IGNsYXNzIExvZ2dlck1vY2sge1xuICBwdWJsaWMgbGFzdExvZztcbiAgcHVibGljIGxhc3RXYXJuO1xuXG4gIHB1YmxpYyBsb2coLi4ub3V0cHV0KSB7XG4gICAgY29uc29sZS5sb2codGhpcy5jb25jYXRWYXJpYWJsZXMob3V0cHV0KSk7XG4gICAgdGhpcy5sYXN0TG9nID0gb3V0cHV0O1xuICB9XG5cbiAgcHVibGljIHdhcm4oLi4ub3V0cHV0KSB7XG4gICAgY29uc29sZS53YXJuKHRoaXMuY29uY2F0VmFyaWFibGVzKG91dHB1dCkpO1xuICAgIHRoaXMubGFzdFdhcm4gPSBvdXRwdXQ7XG4gIH1cblxuICBwcml2YXRlIGNvbmNhdFZhcmlhYmxlcyhpbnB1dCk6IHN0cmluZyB7XG4gICAgbGV0IG91dHB1dCA9IFwiXCI7XG4gICAgaW5wdXQuZm9yRWFjaCgocGVyYW1pdGVyKSA9PiB7XG4gICAgICBvdXRwdXQgKz0gU3RyaW5nKHBlcmFtaXRlcikgKyBcIiBcIjtcbiAgICB9KTtcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUcmFja0Fzc2VydHMge1xuICBwdWJsaWMgc3RhdGljIHZhbHVlOiBib29sZWFuID0gdHJ1ZTtcblxuICBwdWJsaWMgc3RhdGljIGFzc2VydCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMudmFsdWUgPSB0aGlzLnZhbHVlICYmIHZhbHVlO1xuICAgIGNvbnNvbGUuYXNzZXJ0KHZhbHVlKTtcbiAgfVxufVxuXG5cbiIsIi8vIENvcHlyaWdodCAyMDE3IGR1bmNhbiBsYXcgKG1yZHVua0BnbWFpbC5jb20pXG5cbmltcG9ydCB7TW9kZWxCYXNlfSBmcm9tIFwiLi9tb2RlbFwiO1xuaW1wb3J0IHtWaWV3QmFzZX0gZnJvbSBcIi4vdmlld1wiO1xuXG5pbnRlcmZhY2UgSUNvbW1hbmQge1xuICBsaW5lRXZlbnRzOiBJTGluZUV2ZW50W107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVBvaW50IHtcbiAgeDogbnVtYmVyOyAgLy8gUG9ydC9TdGFyYm9yZCBheGlzLlxuICB5OiBudW1iZXI7ICAvLyBVcC9Eb3duIGF4aXMuXG4gIHo6IG51bWJlcjsgIC8vIEZvcmUvQWZ0IGF4aXMuXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUxpbmVQb3Mge1xuICBhOiBJUG9pbnQ7XG4gIGI6IElQb2ludDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJTGluZUV2ZW50IHtcbiAgaWQ6IHN0cmluZztcbiAgc3RhcnRQb3M6IElMaW5lUG9zO1xuICBmaW5pc2hQb3M6IElMaW5lUG9zO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcGFyZVBvaW50KHAxOiBJUG9pbnQsIHAyOiBJUG9pbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIChwMS54ID09PSBwMi54ICYmIHAxLnkgPT09IHAyLnkgJiYgcDEueiA9PT0gcDIueik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wYXJlTGluZVBvcyhscDE6IElMaW5lUG9zLCBscDI6IElMaW5lUG9zKTogYm9vbGVhbiB7XG4gIGlmKGxwMSA9PT0gbnVsbCB8fCBscDIgPT09IG51bGwpIHtcbiAgICByZXR1cm4gKGxwMSA9PT0gbHAyKTtcbiAgfVxuICByZXR1cm4gKGNvbXBhcmVQb2ludChscDEuYSwgbHAyLmEpICYmIGNvbXBhcmVQb2ludChscDEuYiwgbHAyLmIpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhcmVMaW5lRXZlbnQoZTE6IElMaW5lRXZlbnQsIGUyOiBJTGluZUV2ZW50KTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgZTEuaWQgPT09IGUyLmlkICYmXG4gICAgY29tcGFyZUxpbmVQb3MoZTEuc3RhcnRQb3MsIGUyLnN0YXJ0UG9zKSAmJlxuICAgIGNvbXBhcmVMaW5lUG9zKGUxLmZpbmlzaFBvcywgZTIuZmluaXNoUG9zKVxuICApO1xufVxuXG5leHBvcnQgY2xhc3MgQ29udHJvbGxlciB7XG4gIHByaXZhdGUgaWRHZW5lcmF0b3I6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgY29tbWFuZHM6IElDb21tYW5kW107XG4gIHByaXZhdGUgY29tbWFuZFBvaW50ZXI6IG51bWJlcjtcbiAgcHJpdmF0ZSB2aWV3czogVmlld0Jhc2VbXTtcbiAgcHJpdmF0ZSBtb2RlbDogTW9kZWxCYXNlO1xuICBwcml2YXRlIGxvZ2dlcjtcbiAgcHJpdmF0ZSBidXR0b25TdGF0ZXMgPSB7XG4gICAgYWRkTGluZToge3N0YXRlOiBmYWxzZSwgY2xlYXI6IFtcImRlbGV0ZVwiLCBcIm1pcnJvclwiXX0sXG4gICAgZGVsZXRlOiB7c3RhdGU6IGZhbHNlLCBjbGVhcjogW1wiYWRkTGluZVwiLCBcIm1pcnJvclwiXX0sXG4gICAgbWlycm9yOiB7c3RhdGU6IGZhbHNlLCBjbGVhcjogW1wiYWRkTGluZVwiLCBcImRlbGV0ZVwiXX0sXG4gICAgYWxsTGF5ZXJzOiB7c3RhdGU6IGZhbHNlLCBjbGVhcjogW119LFxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKG1vZGVsOiBNb2RlbEJhc2UsIHZpZXdzOiBWaWV3QmFzZVtdLCBsb2dnZXI/KSB7XG4gICAgdGhpcy5tb2RlbCA9IG1vZGVsOyAgLy8gVE9ETyBDYW4gdGhpcyBiZSBhc3NpZ25lZCBhdXRvbWF0aWNhbGx5P1xuICAgIHRoaXMudmlld3MgPSB2aWV3cztcbiAgICB0aGlzLmxvZ2dlciA9IGxvZ2dlciB8fCBjb25zb2xlO1xuICAgIHRoaXMuY29tbWFuZHMgPSBbXTtcbiAgICB0aGlzLmNvbW1hbmRQb2ludGVyID0gMDtcblxuICAgIGlmKG1vZGVsKSB7XG4gICAgICBtb2RlbC5pbml0KHRoaXMpO1xuICAgIH1cblxuICAgIHZpZXdzLmZvckVhY2goKHZpZXcpID0+IHtcbiAgICAgIHZpZXcuaW5pdCh0aGlzKTtcbiAgICB9KTtcblxuICAgIHRoaXMuc2V0QnV0dG9uU3RhdGVzKCk7XG4gIH1cblxuICBwdWJsaWMgb25CdXR0b25FdmVudChidXR0b25MYWJlbDogc3RyaW5nKSB7XG4gICAgdGhpcy5sb2dnZXIubG9nKGJ1dHRvbkxhYmVsKTtcblxuICAgIHN3aXRjaCAoYnV0dG9uTGFiZWwpIHtcbiAgICAgIGNhc2UgXCJ1bmRvXCI6XG4gICAgICAgIHRoaXMudW5kb0NvbW1hbmQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwicmVkb1wiOlxuICAgICAgICB0aGlzLnBlcmZvcm1Db21tYW5kKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImNsZWFyXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFkZExpbmVcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiZGVsZXRlXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIm1pcnJvclwiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJhbGxMYXllcnNcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiYmFja2dyb3VuZFwiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJzYXZlXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImxvYWRcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKFwiSW52YWxpZCBidXR0b25MYWJlbDpcIiwgYnV0dG9uTGFiZWwpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMudXBkYXRlQnV0dG9uKGJ1dHRvbkxhYmVsKTtcbiAgfVxuXG4gIHB1YmxpYyBvbkxpbmVFdmVudChsaW5lRXZlbnQ6IElMaW5lRXZlbnQpIHtcbiAgICBpZighbGluZUV2ZW50LnN0YXJ0UG9zICYmICFsaW5lRXZlbnQuZmluaXNoUG9zKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKFwiTm8gc3RhcnRQb3Mgb3IgZmluaXNoUG9zIGZvciBsaW5lOiBcIiwgbGluZUV2ZW50LmlkKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZihsaW5lRXZlbnQuc3RhcnRQb3MgJiZcbiAgICAgICAoIWxpbmVFdmVudC5zdGFydFBvcy5hIHx8ICFsaW5lRXZlbnQuc3RhcnRQb3MuYikpIHtcbiAgICAgIHRoaXMubG9nZ2VyLndhcm4oXG4gICAgICAgIFwiTWlzc2luZyBlbmRwb2ludCBmb3Igc3RhcnRQb3Mgb2YgbGluZTogXCIsIGxpbmVFdmVudC5pZCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmKGxpbmVFdmVudC5maW5pc2hQb3MgJiZcbiAgICAgICAoIWxpbmVFdmVudC5maW5pc2hQb3MuYSB8fCAhbGluZUV2ZW50LmZpbmlzaFBvcy5iKSkge1xuICAgICAgdGhpcy5sb2dnZXIud2FybihcbiAgICAgICAgXCJNaXNzaW5nIGVuZHBvaW50IGZvciBlbmRQb3Mgb2YgbGluZTogXCIsIGxpbmVFdmVudC5pZCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYoIWxpbmVFdmVudC5pZCkge1xuICAgICAgaWYobGluZUV2ZW50LnN0YXJ0UG9zKSB7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oXG4gICAgICAgICAgXCJObyBpZCBzcGVjaWZpZWQgZm9yIGxpbmUgYmVpbmcgbW92ZWQgb3IgZGVsZXRlZC5cIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIE5vIGlkIGFuZCBubyBsaW5lRXZlbnQuc3RhcnRQb3MgaW1wbGllcyB0aGlzIGlzIGEgbmV3IGxpbmUuXG4gICAgICBsaW5lRXZlbnQuaWQgPSBcImxpbmVfXCIgKyB0aGlzLmlkR2VuZXJhdG9yO1xuICAgICAgdGhpcy5pZEdlbmVyYXRvcisrO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbW1hbmQ6IElDb21tYW5kID0ge1xuICAgICAgbGluZUV2ZW50czogW2xpbmVFdmVudF0sXG4gICAgfTtcbiAgICB0aGlzLnJlY29yZENvbW1hbmQoY29tbWFuZCk7XG4gICAgdGhpcy5wZXJmb3JtQ29tbWFuZCgpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZUJ1dHRvbihidXR0b25MYWJlbDogc3RyaW5nKSB7XG4gICAgaWYodGhpcy5idXR0b25TdGF0ZXNbYnV0dG9uTGFiZWxdID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIEp1c3QgYSBzaW1wbGUgbm9uLXRvZ2dsaW5nIHB1c2ggYnV0dG9uLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuYnV0dG9uU3RhdGVzW2J1dHRvbkxhYmVsXS52YWx1ZSA9XG4gICAgICAhdGhpcy5idXR0b25TdGF0ZXNbYnV0dG9uTGFiZWxdLnZhbHVlO1xuICAgIGNvbnN0IHZhbHVlID0gdGhpcy5idXR0b25TdGF0ZXNbYnV0dG9uTGFiZWxdLnZhbHVlO1xuICAgIHRoaXMudmlld3MuZm9yRWFjaCgodmlldykgPT4ge1xuICAgICAgdmlldy5zZXRCdXR0b25WYWx1ZShidXR0b25MYWJlbCwgdmFsdWUpO1xuICAgICAgdGhpcy5idXR0b25TdGF0ZXNbYnV0dG9uTGFiZWxdLmNsZWFyLmZvckVhY2goKG90aGVyQnV0dG9uTGFiZWwpID0+IHtcbiAgICAgICAgdGhpcy5idXR0b25TdGF0ZXNbb3RoZXJCdXR0b25MYWJlbF0udmFsdWUgPSBmYWxzZTtcbiAgICAgICAgdmlldy5zZXRCdXR0b25WYWx1ZShvdGhlckJ1dHRvbkxhYmVsLCBmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFNldCB3aGV0aGVyIHRoZSBcImJhY2tcIiBhbmQgXCJmb3J3YXJkXCIgYnV0dG9ucyBhcmUgc2VsZWN0YWJsZS5cbiAgcHJpdmF0ZSBzZXRCdXR0b25TdGF0ZXMoKSB7XG4gICAgdGhpcy52aWV3cy5mb3JFYWNoKCh2aWV3KSA9PiB7XG4gICAgICB2aWV3LnNldEJ1dHRvblN0YXRlKFwidW5kb1wiLCB0aGlzLmNvbW1hbmRQb2ludGVyID4gMCk7XG4gICAgICB2aWV3LnNldEJ1dHRvblN0YXRlKFwicmVkb1wiLCB0aGlzLmNvbW1hbmRQb2ludGVyIDwgdGhpcy5jb21tYW5kcy5sZW5ndGgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZWNvcmRDb21tYW5kKGNvbW1hbmQ6IElDb21tYW5kKSB7XG4gICAgdGhpcy5jb21tYW5kcyA9IHRoaXMuY29tbWFuZHMuc2xpY2UoMCwgdGhpcy5jb21tYW5kUG9pbnRlcik7XG4gICAgdGhpcy5jb21tYW5kcy5wdXNoKGNvbW1hbmQpO1xuICB9XG5cbiAgcHJpdmF0ZSBwZXJmb3JtQ29tbWFuZChjb21tYW5kSW5kZXg/OiBudW1iZXIpIHtcbiAgICBpZihjb21tYW5kSW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29tbWFuZEluZGV4ID0gdGhpcy5jb21tYW5kUG9pbnRlcjtcbiAgICB9XG4gICAgaWYoY29tbWFuZEluZGV4ID49IHRoaXMuY29tbWFuZHMubGVuZ3RoIHx8IGNvbW1hbmRJbmRleCA8IDApIHtcbiAgICAgIHRoaXMubG9nZ2VyLndhcm4oXCJUcnlpbmcgdG8gcGVyZm9ybUNvbW1hbmQgcGFzdCBlbmQgb2YgYnVmZmVyLiBpbmRleDpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgY29tbWFuZEluZGV4KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY29tbWFuZCA9IHRoaXMuY29tbWFuZHNbY29tbWFuZEluZGV4XTtcbiAgICBjb21tYW5kLmxpbmVFdmVudHMuZm9yRWFjaCgobGluZUV2ZW50KSA9PiB7XG4gICAgICB0aGlzLm1vZGVsLm9uTGluZUV2ZW50KGxpbmVFdmVudCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmNvbW1hbmRQb2ludGVyKys7XG4gICAgdGhpcy5zZXRCdXR0b25TdGF0ZXMoKTtcbiAgfVxuXG4gIHByaXZhdGUgdW5kb0NvbW1hbmQoY29tbWFuZEluZGV4PzogbnVtYmVyKSB7XG4gICAgdGhpcy5jb21tYW5kUG9pbnRlci0tO1xuICAgIGlmKGNvbW1hbmRJbmRleCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb21tYW5kSW5kZXggPSB0aGlzLmNvbW1hbmRQb2ludGVyO1xuICAgIH1cbiAgICBpZihjb21tYW5kSW5kZXggPj0gdGhpcy5jb21tYW5kcy5sZW5ndGggfHwgY29tbWFuZEluZGV4IDwgMCkge1xuICAgICAgdGhpcy5sb2dnZXIud2FybihcIlRyeWluZyB0byBwZXJmb3JtQ29tbWFuZCBwYXN0IGVuZCBvZiBidWZmZXIuIGluZGV4OlwiLFxuICAgICAgICAgICAgICAgICAgICAgICBjb21tYW5kSW5kZXgpO1xuICAgICAgdGhpcy5jb21tYW5kUG9pbnRlciA9IDA7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGNvbW1hbmQgPSB0aGlzLmNvbW1hbmRzW2NvbW1hbmRJbmRleF07XG4gICAgY29tbWFuZC5saW5lRXZlbnRzLmZvckVhY2goKGxpbmVFdmVudCkgPT4ge1xuICAgICAgY29uc3QgcmV2ZXJzZUxpbmVFdmVudCA9IHtcbiAgICAgICAgaWQ6IGxpbmVFdmVudC5pZCxcbiAgICAgICAgc3RhcnRQb3M6IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobGluZUV2ZW50LmZpbmlzaFBvcykpLFxuICAgICAgICBmaW5pc2hQb3M6IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobGluZUV2ZW50LnN0YXJ0UG9zKSksXG4gICAgICB9O1xuICAgICAgdGhpcy5tb2RlbC5vbkxpbmVFdmVudChyZXZlcnNlTGluZUV2ZW50KTtcbiAgICB9KTtcbiAgICB0aGlzLnNldEJ1dHRvblN0YXRlcygpO1xuICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBkdW5jYW4gbGF3IChtcmR1bmtAZ21haWwuY29tKVxuXG5pbXBvcnQge0xvZ2dlck1vY2ssIFRyYWNrQXNzZXJ0c30gZnJvbSBcIi4vY29tbW9uRnVuY3Rpb25zdFRlc3RzXCI7XG5pbXBvcnQge1xuICBjb21wYXJlTGluZUV2ZW50LFxuICBjb21wYXJlTGluZVBvcyxcbiAgQ29udHJvbGxlcixcbiAgSUxpbmVFdmVudCxcbiAgSUxpbmVQb3MsXG4gIElQb2ludCxcbn0gZnJvbSBcIi4vY29udHJvbGxlclwiO1xuaW1wb3J0IHtNb2RlbE1vY2t9IGZyb20gXCIuL21vZGVsXCI7XG5pbXBvcnQge1ZpZXdNb2NrfSBmcm9tIFwiLi92aWV3XCI7XG5cbmV4cG9ydCBjb25zdCBjb250cm9sbGVyQnV0dG9uRXZlbnRUZXN0cyA9IHtcbiAgdGVzdEludmFsaWRCdXR0b246ICgpID0+IHtcbiAgICBjb25zdCBtb2RlbCA9IG51bGw7XG4gICAgY29uc3QgdG9vbGJhcjEgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCB0b29sYmFyMiA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXJNb2NrKCk7XG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBDb250cm9sbGVyKG1vZGVsLCBbdG9vbGJhcjEsIHRvb2xiYXIyXSwgbG9nZ2VyKTtcblxuICAgIGNvbnN0IGJ1dHRvbkxhYmVsID0gXCJzb21lSW52YWxpZEJ1dHRvblwiO1xuXG4gICAgLy8gUGVyZm9ybSBhY3Rpb24gdW5kZXIgdGVzdC5cbiAgICB0b29sYmFyMS5zaW11bGF0ZUJ1dHRvblByZXNzKGJ1dHRvbkxhYmVsKTtcblxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQobG9nZ2VyLmxhc3RXYXJuWzBdID09PSBcIkludmFsaWQgYnV0dG9uTGFiZWw6XCIgJiZcbiAgICAgICAgICAgICAgICAgICBsb2dnZXIubGFzdFdhcm5bMV0gPT09IGJ1dHRvbkxhYmVsKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIxLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbF0gPT09IHVuZGVmaW5lZCk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMi5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWxdID09PSB1bmRlZmluZWQpO1xuICB9LFxuXG4gIHRlc3RSZWd1bGFyQnV0dG9uOiAoKSA9PiB7XG4gICAgY29uc3QgbW9kZWwgPSBudWxsO1xuICAgIGNvbnN0IHRvb2xiYXIxID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgdG9vbGJhcjIgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyTW9jaygpO1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQ29udHJvbGxlcihtb2RlbCwgW3Rvb2xiYXIxLCB0b29sYmFyMl0sIGxvZ2dlcik7XG5cbiAgICBjb25zdCBidXR0b25MYWJlbCA9IFwiY2xlYXJcIjtcblxuICAgIC8vIFBlcmZvcm0gYWN0aW9uIHVuZGVyIHRlc3QuXG4gICAgdG9vbGJhcjEuc2ltdWxhdGVCdXR0b25QcmVzcyhidXR0b25MYWJlbCk7XG5cbiAgICAvLyBTaW5jZSB0aGlzIGJ1dHRvbiBkb2VzIG5vdCBzdGF5IGRlcHJlc3NlZCxcbiAgICAvLyB0aGVyZSBpcyBub3RoaW5nIHRvIHVwZGF0ZSBvbiB0aGUgdmlldyBvYmplY3QuXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMS5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWxdID09PSB1bmRlZmluZWQpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjIuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsXSA9PT0gdW5kZWZpbmVkKTtcbiAgfSxcblxuICB0ZXN0U2luZ2xlVG9nZ2xlQnV0dG9uOiAoKSA9PiB7XG4gICAgY29uc3QgbW9kZWwgPSBudWxsO1xuICAgIGNvbnN0IHRvb2xiYXIxID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgdG9vbGJhcjIgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyTW9jaygpO1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQ29udHJvbGxlcihtb2RlbCwgW3Rvb2xiYXIxLCB0b29sYmFyMl0sIGxvZ2dlcik7XG5cbiAgICBjb25zdCBidXR0b25MYWJlbCA9IFwiYWxsTGF5ZXJzXCI7XG5cbiAgICAvLyBQZXJmb3JtIGFjdGlvbiB1bmRlciB0ZXN0LlxuICAgIHRvb2xiYXIxLnNpbXVsYXRlQnV0dG9uUHJlc3MoYnV0dG9uTGFiZWwpO1xuXG4gICAgLy8gVGhpcyBidXR0b24gc3RheXMgZGVwcmVzc2VkIHNvIGl0IHNob3VsZCB1cGRhdGUgdGhlIHZpZXdzLlxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjEuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsXSA9PT0gdHJ1ZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMi5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWxdID09PSB0cnVlKTtcblxuICAgIC8vIFBlcmZvcm0gYWN0aW9uIHVuZGVyIHRlc3QgYWdhaW4uXG4gICAgdG9vbGJhcjEuc2ltdWxhdGVCdXR0b25QcmVzcyhidXR0b25MYWJlbCk7XG5cbiAgICAvLyBTZWNvbmQgcHJlc3Mgc2hvdWxkIGNsZWFyIGJ1dHRvbi5cbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIxLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbF0gPT09IGZhbHNlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIyLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbF0gPT09IGZhbHNlKTtcbiAgfSxcblxuICB0ZXN0UGFpcmVkVG9nZ2xlQnV0dG9uczogKCkgPT4ge1xuICAgIGNvbnN0IG1vZGVsID0gbnVsbDtcbiAgICBjb25zdCB0b29sYmFyMSA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IHRvb2xiYXIyID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlck1vY2soKTtcbiAgICBjb25zdCBjb250cm9sbGVyID0gbmV3IENvbnRyb2xsZXIobW9kZWwsIFt0b29sYmFyMSwgdG9vbGJhcjJdLCBsb2dnZXIpO1xuXG4gICAgLy8gT25seSBvbmUgb2YgdGhlc2UgYnV0dG9ucyBjYW4gYmUgdG9nZ2xlZCBhdCBvbmNlLlxuICAgIGNvbnN0IGJ1dHRvbkxhYmVsMSA9IFwiYWRkTGluZVwiO1xuICAgIGNvbnN0IGJ1dHRvbkxhYmVsMiA9IFwiZGVsZXRlXCI7XG4gICAgY29uc3QgYnV0dG9uTGFiZWwzID0gXCJtaXJyb3JcIjtcblxuICAgIC8vIFBlcmZvcm0gYWN0aW9uIHVuZGVyIHRlc3QuXG4gICAgdG9vbGJhcjEuc2ltdWxhdGVCdXR0b25QcmVzcyhidXR0b25MYWJlbDEpO1xuXG4gICAgLy8gVGhpcyBidXR0b24gc3RheXMgZGVwcmVzc2VkIHNvIGl0IHNob3VsZCB1cGRhdGUgdGhlIHZpZXdzLlxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjEuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsMV0gPT09IHRydWUpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjIuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsMV0gPT09IHRydWUpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjEuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsMl0gPT09IGZhbHNlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIyLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbDJdID09PSBmYWxzZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMS5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWwzXSA9PT0gZmFsc2UpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjIuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsM10gPT09IGZhbHNlKTtcblxuICAgIC8vIFBlcmZvcm0gYWN0aW9uIHVuZGVyIHRlc3QgYWdhaW4uXG4gICAgdG9vbGJhcjEuc2ltdWxhdGVCdXR0b25QcmVzcyhidXR0b25MYWJlbDEpO1xuXG4gICAgLy8gU2Vjb25kIHByZXNzIHNob3VsZCBjbGVhciBidXR0b24uXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMS5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWwxXSA9PT0gZmFsc2UpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjIuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsMV0gPT09IGZhbHNlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIxLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbDJdID09PSBmYWxzZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMi5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWwyXSA9PT0gZmFsc2UpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjEuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsM10gPT09IGZhbHNlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIyLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbDNdID09PSBmYWxzZSk7XG5cbiAgICAvLyBQZXJmb3JtIGFjdGlvbiB1bmRlciB0ZXN0IGFnYWluLlxuICAgIC8vIFNldCBvbmUgYnV0dG9uIHRoZW4gc2V0IGEgZGlmZmVyZW50IGJ1dHRvbi5cbiAgICB0b29sYmFyMS5zaW11bGF0ZUJ1dHRvblByZXNzKGJ1dHRvbkxhYmVsMSk7XG4gICAgdG9vbGJhcjEuc2ltdWxhdGVCdXR0b25QcmVzcyhidXR0b25MYWJlbDIpO1xuXG4gICAgLy8gRGlmZmVyZW50IGJ1dHRvbiBwcmVzcyBzaG91bGQgY2xlYXIgYnV0dG9uTGFiZWwxLlxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjEuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsMV0gPT09IGZhbHNlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIyLmJ1dHRvblZhbHVlc1tidXR0b25MYWJlbDFdID09PSBmYWxzZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMS5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWwyXSA9PT0gdHJ1ZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMi5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWwyXSA9PT0gdHJ1ZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyMS5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWwzXSA9PT0gZmFsc2UpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhcjIuYnV0dG9uVmFsdWVzW2J1dHRvbkxhYmVsM10gPT09IGZhbHNlKTtcbiAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBjb250cm9sbGVyTGluZUV2ZW50VGVzdHMgPSB7XG4gIHRlc3ROZXdJbnZhbGlkTGluZTogKCkgPT4ge1xuICAgIGNvbnN0IG1vZGVsID0gbmV3IE1vZGVsTW9jaygpO1xuICAgIGNvbnN0IHdpZGdldDEgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCB3aWRnZXQyID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgdG9vbGJhciA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXJNb2NrKCk7XG4gICAgY29uc3QgY29udHJvbGxlciA9XG4gICAgICBuZXcgQ29udHJvbGxlcihtb2RlbCwgW3dpZGdldDEsIHdpZGdldDIsIHRvb2xiYXJdLCBsb2dnZXIpO1xuXG4gICAgLy8gUGVyZm9ybSBhY3Rpb24gdW5kZXIgdGVzdC5cbiAgICB3aWRnZXQxLnNpbXVsYXRlTGluZUV2ZW50KG51bGwsIG51bGwsIG51bGwpO1xuXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChtb2RlbC5saW5lRXZlbnRzLmxlbmd0aCA9PT0gMCk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChcbiAgICAgIGxvZ2dlci5sYXN0V2FyblswXSA9PT0gXCJObyBzdGFydFBvcyBvciBmaW5pc2hQb3MgZm9yIGxpbmU6IFwiICYmXG4gICAgICBsb2dnZXIubGFzdFdhcm5bMV0gPT09IG51bGwpO1xuICB9LFxuXG4gIHRlc3ROZXdJbnZhbGlkTGluZU1pc3NpbmdQb2ludDogKCkgPT4ge1xuICAgIGNvbnN0IG1vZGVsID0gbmV3IE1vZGVsTW9jaygpO1xuICAgIGNvbnN0IHdpZGdldDEgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCB3aWRnZXQyID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgdG9vbGJhciA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXJNb2NrKCk7XG4gICAgY29uc3QgY29udHJvbGxlciA9XG4gICAgICBuZXcgQ29udHJvbGxlcihtb2RlbCwgW3dpZGdldDEsIHdpZGdldDIsIHRvb2xiYXJdLCBsb2dnZXIpO1xuXG4gICAgY29uc3QgbGluZVBvczogSUxpbmVQb3MgPSB7XG4gICAgICBhOiB7eDoxLCB5OjIsIHo6M30sXG4gICAgICBiOiBudWxsLFxuICAgIH07XG5cbiAgICAvLyBQZXJmb3JtIGFjdGlvbiB1bmRlciB0ZXN0LlxuICAgIHdpZGdldDEuc2ltdWxhdGVMaW5lRXZlbnQobnVsbCwgbGluZVBvcywgbnVsbCk7XG5cbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KG1vZGVsLmxpbmVFdmVudHMubGVuZ3RoID09PSAwKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KFxuICAgICAgbG9nZ2VyLmxhc3RXYXJuWzBdID09PSBcIk1pc3NpbmcgZW5kcG9pbnQgZm9yIHN0YXJ0UG9zIG9mIGxpbmU6IFwiICYmXG4gICAgICBsb2dnZXIubGFzdFdhcm5bMV0gPT09IG51bGwpO1xuXG4gICAgLy8gUGVyZm9ybSBhY3Rpb24gdW5kZXIgdGVzdCBhZ2Fpbi5cbiAgICB3aWRnZXQxLnNpbXVsYXRlTGluZUV2ZW50KG51bGwsIG51bGwsIGxpbmVQb3MpO1xuXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChtb2RlbC5saW5lRXZlbnRzLmxlbmd0aCA9PT0gMCk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChcbiAgICAgIGxvZ2dlci5sYXN0V2FyblswXSA9PT0gXCJNaXNzaW5nIGVuZHBvaW50IGZvciBlbmRQb3Mgb2YgbGluZTogXCIgJiZcbiAgICAgIGxvZ2dlci5sYXN0V2FyblsxXSA9PT0gbnVsbCk7XG4gIH0sXG5cbiAgdGVzdE5ld0ludmFsaWRMaW5lTm9JZE9uTW92ZTogKCkgPT4ge1xuICAgIGNvbnN0IG1vZGVsID0gbmV3IE1vZGVsTW9jaygpO1xuICAgIGNvbnN0IHdpZGdldDEgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCB3aWRnZXQyID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgdG9vbGJhciA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXJNb2NrKCk7XG4gICAgY29uc3QgY29udHJvbGxlciA9XG4gICAgICBuZXcgQ29udHJvbGxlcihtb2RlbCwgW3dpZGdldDEsIHdpZGdldDIsIHRvb2xiYXJdLCBsb2dnZXIpO1xuXG4gICAgY29uc3QgbGluZVBvc1N0YXJ0OiBJTGluZVBvcyA9IHtcbiAgICAgIGE6IHt4OjEsIHk6MiwgejozfSxcbiAgICAgIGI6IHt4OjExLCB5OjIyLCB6OjMzfSxcbiAgICB9O1xuXG4gICAgY29uc3QgbGluZVBvc0ZpbmlzaDogSUxpbmVQb3MgPSB7XG4gICAgICBhOiB7eDo0LCB5OjUsIHo6Nn0sXG4gICAgICBiOiB7eDo0NCwgeTo1NSwgejo2Nn0sXG4gICAgfTtcblxuICAgIC8vIFBlcmZvcm0gYWN0aW9uIHVuZGVyIHRlc3QuXG4gICAgd2lkZ2V0MS5zaW11bGF0ZUxpbmVFdmVudChudWxsLCBsaW5lUG9zU3RhcnQsIGxpbmVQb3NGaW5pc2gpO1xuXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChtb2RlbC5saW5lRXZlbnRzLmxlbmd0aCA9PT0gMCk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChsb2dnZXIubGFzdFdhcm5bMF0gPT09XG4gICAgICBcIk5vIGlkIHNwZWNpZmllZCBmb3IgbGluZSBiZWluZyBtb3ZlZCBvciBkZWxldGVkLlwiKTtcbiAgfSxcblxuICB0ZXN0TW92ZUxpbmU6ICgpID0+IHtcbiAgICBjb25zdCBtb2RlbCA9IG5ldyBNb2RlbE1vY2soKTtcbiAgICBjb25zdCB3aWRnZXQxID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3Qgd2lkZ2V0MiA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IHRvb2xiYXIgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyTW9jaygpO1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPVxuICAgICAgbmV3IENvbnRyb2xsZXIobW9kZWwsIFt3aWRnZXQxLCB3aWRnZXQyLCB0b29sYmFyXSwgbG9nZ2VyKTtcblxuICAgIGNvbnN0IGxpbmVQb3NTdGFydDogSUxpbmVQb3MgPSB7XG4gICAgICBhOiB7eDoxLCB5OjIsIHo6M30sXG4gICAgICBiOiB7eDoxMSwgeToyMiwgejozM30sXG4gICAgfTtcblxuICAgIGNvbnN0IGxpbmVQb3NGaW5pc2g6IElMaW5lUG9zID0ge1xuICAgICAgYToge3g6NCwgeTo1LCB6OjZ9LFxuICAgICAgYjoge3g6NDQsIHk6NTUsIHo6NjZ9LFxuICAgIH07XG5cbiAgICAvLyBQZXJmb3JtIGFjdGlvbiB1bmRlciB0ZXN0LlxuICAgIC8vIEFsdGhvdWdoIHRoaXMgaXMgbW92aW5nIGEgbGluZSB0aGF0IGRvZXMgbm90IGFjdHVhbGx5IGV4aXN0IG9uIHRoZSBtb2RlbCxcbiAgICAvLyBpdCBpcyBub3QgdXAgdG8gdGhlIGNvbnRyb2xsZXIgdG8gcG9saWNlIHRoaXMgc28gdGhlIHRlc3QgcGFzc2VzLlxuICAgIHdpZGdldDEuc2ltdWxhdGVMaW5lRXZlbnQoXCJzb21lSWRcIiwgbGluZVBvc1N0YXJ0LCBsaW5lUG9zRmluaXNoKTtcblxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQobW9kZWwubGluZUV2ZW50cy5sZW5ndGggPT09IDEpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhci5idXR0b25TdGF0ZXMudW5kbyA9PT0gdHJ1ZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyLmJ1dHRvblN0YXRlcy5yZWRvID09PSBmYWxzZSk7XG4gIH0sXG5cbiAgdGVzdERlbGV0ZUxpbmU6ICgpID0+IHtcbiAgICBjb25zdCBtb2RlbCA9IG5ldyBNb2RlbE1vY2soKTtcbiAgICBjb25zdCB3aWRnZXQxID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3Qgd2lkZ2V0MiA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IHRvb2xiYXIgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyTW9jaygpO1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPVxuICAgICAgbmV3IENvbnRyb2xsZXIobW9kZWwsIFt3aWRnZXQxLCB3aWRnZXQyLCB0b29sYmFyXSwgbG9nZ2VyKTtcblxuICAgIGNvbnN0IGxpbmVQb3NTdGFydDogSUxpbmVQb3MgPSB7XG4gICAgICBhOiB7eDoxLCB5OjIsIHo6M30sXG4gICAgICBiOiB7eDoxMSwgeToyMiwgejozM30sXG4gICAgfTtcblxuICAgIC8vIFBlcmZvcm0gYWN0aW9uIHVuZGVyIHRlc3QuXG4gICAgLy8gQWx0aG91Z2ggdGhpcyBpcyBkZWxldGluZyBhIGxpbmUgdGhhdCBkb2VzIG5vdCBhY3R1YWxseSBleGlzdCBvbiB0aGVcbiAgICAvLyBtb2RlbCwgaXQgaXMgbm90IHVwIHRvIHRoZSBjb250cm9sbGVyIHRvIHBvbGljZSB0aGlzIHNvIHRoZSB0ZXN0IHBhc3Nlcy5cbiAgICB3aWRnZXQxLnNpbXVsYXRlTGluZUV2ZW50KFwic29tZUlkXCIsIGxpbmVQb3NTdGFydCwgbnVsbCk7XG5cbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KG1vZGVsLmxpbmVFdmVudHMubGVuZ3RoID09PSAxKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIuYnV0dG9uU3RhdGVzLnVuZG8gPT09IHRydWUpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhci5idXR0b25TdGF0ZXMucmVkbyA9PT0gZmFsc2UpO1xuICB9LFxuXG4gIHRlc3ROZXdMaW5lOiAoKSA9PiB7XG4gICAgY29uc3QgbW9kZWwgPSBuZXcgTW9kZWxNb2NrKCk7XG4gICAgY29uc3Qgd2lkZ2V0MSA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IHdpZGdldDIgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCB0b29sYmFyID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlck1vY2soKTtcbiAgICBjb25zdCBjb250cm9sbGVyID1cbiAgICAgIG5ldyBDb250cm9sbGVyKG1vZGVsLCBbd2lkZ2V0MSwgd2lkZ2V0MiwgdG9vbGJhcl0sIGxvZ2dlcik7XG5cbiAgICBjb25zdCBsaW5lUG9zRmluaXNoOiBJTGluZVBvcyA9IHtcbiAgICAgIGE6IHt4OjQsIHk6NSwgejo2fSxcbiAgICAgIGI6IHt4OjQ0LCB5OjU1LCB6OjY2fSxcbiAgICB9O1xuXG4gICAgLy8gUGVyZm9ybSBhY3Rpb24gdW5kZXIgdGVzdC5cbiAgICB3aWRnZXQxLnNpbXVsYXRlTGluZUV2ZW50KG51bGwsIG51bGwsIGxpbmVQb3NGaW5pc2gpO1xuXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChtb2RlbC5saW5lRXZlbnRzLmxlbmd0aCA9PT0gMSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyLmJ1dHRvblN0YXRlcy51bmRvID09PSB0cnVlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIuYnV0dG9uU3RhdGVzLnJlZG8gPT09IGZhbHNlKTtcbiAgfSxcblxuICB0ZXN0TXVsdGlwbGVOZXdMaW5lczogKCkgPT4ge1xuICAgIGNvbnN0IG1vZGVsID0gbmV3IE1vZGVsTW9jaygpO1xuICAgIGNvbnN0IHdpZGdldDEgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCB3aWRnZXQyID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgdG9vbGJhciA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXJNb2NrKCk7XG4gICAgY29uc3QgY29udHJvbGxlciA9XG4gICAgICBuZXcgQ29udHJvbGxlcihtb2RlbCwgW3dpZGdldDEsIHdpZGdldDIsIHRvb2xiYXJdLCBsb2dnZXIpO1xuXG4gICAgY29uc3QgbGluZVBvc0ZpbmlzaDogSUxpbmVQb3MgPSB7XG4gICAgICBhOiB7eDo0LCB5OjUsIHo6Nn0sXG4gICAgICBiOiB7eDo0NCwgeTo1NSwgejo2Nn0sXG4gICAgfTtcblxuICAgIC8vIEFkZCBzb21lIGxpbmVzLlxuICAgIHdpZGdldDEuc2ltdWxhdGVMaW5lRXZlbnQobnVsbCwgbnVsbCwgbGluZVBvc0ZpbmlzaCk7XG4gICAgd2lkZ2V0MS5zaW11bGF0ZUxpbmVFdmVudChudWxsLCBudWxsLCBsaW5lUG9zRmluaXNoKTtcbiAgICB3aWRnZXQxLnNpbXVsYXRlTGluZUV2ZW50KG51bGwsIG51bGwsIGxpbmVQb3NGaW5pc2gpO1xuXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChtb2RlbC5saW5lRXZlbnRzLmxlbmd0aCA9PT0gMyk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyLmJ1dHRvblN0YXRlcy51bmRvID09PSB0cnVlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIuYnV0dG9uU3RhdGVzLnJlZG8gPT09IGZhbHNlKTtcbiAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBjb250cm9sbGVyQ29tbWFuZEhpc3RvcnlUZXN0cyA9IHtcbiAgdGVzdFVuZG9CdXR0b246ICgpID0+IHtcbiAgICBjb25zdCBtb2RlbCA9IG5ldyBNb2RlbE1vY2soKTtcbiAgICBjb25zdCB3aWRnZXQxID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3Qgd2lkZ2V0MiA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IHRvb2xiYXIgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyTW9jaygpO1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPVxuICAgICAgbmV3IENvbnRyb2xsZXIobW9kZWwsIFt3aWRnZXQxLCB3aWRnZXQyLCB0b29sYmFyXSwgbG9nZ2VyKTtcblxuICAgIGNvbnN0IGxpbmVQb3NGaW5pc2g6IElMaW5lUG9zID0ge1xuICAgICAgYToge3g6NCwgeTo1LCB6OjZ9LFxuICAgICAgYjoge3g6NDQsIHk6NTUsIHo6NjZ9LFxuICAgIH07XG5cbiAgICAvLyBBZGQgc29tZSBsaW5lcy5cbiAgICB3aWRnZXQxLnNpbXVsYXRlTGluZUV2ZW50KG51bGwsIG51bGwsIGxpbmVQb3NGaW5pc2gpO1xuICAgIHdpZGdldDEuc2ltdWxhdGVMaW5lRXZlbnQobnVsbCwgbnVsbCwgbGluZVBvc0ZpbmlzaCk7XG4gICAgd2lkZ2V0MS5zaW11bGF0ZUxpbmVFdmVudChudWxsLCBudWxsLCBsaW5lUG9zRmluaXNoKTtcblxuICAgIC8vIENvbmZpcm0gd2UgYXJlIG9uIHRyYWNrLlxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQobW9kZWwubGluZUV2ZW50cy5sZW5ndGggPT09IDMpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhci5idXR0b25TdGF0ZXMudW5kbyA9PT0gdHJ1ZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyLmJ1dHRvblN0YXRlcy5yZWRvID09PSBmYWxzZSk7XG5cbiAgICAvLyBQZXJmb3JtIGFjdGlvbiB1bmRlciB0ZXN0LlxuICAgIHRvb2xiYXIuc2ltdWxhdGVCdXR0b25QcmVzcyhcInVuZG9cIik7XG5cbiAgICAvLyBDb25maXJtIHdlIGFyZSBvbiB0cmFjay5cbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KG1vZGVsLmxpbmVFdmVudHMubGVuZ3RoID09PSA0KTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIuYnV0dG9uU3RhdGVzLnVuZG8gPT09IHRydWUpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhci5idXR0b25TdGF0ZXMucmVkbyA9PT0gdHJ1ZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChtb2RlbC5saW5lRXZlbnRzWzJdLmlkID09PSBtb2RlbC5saW5lRXZlbnRzWzNdLmlkKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KGNvbXBhcmVMaW5lUG9zKG1vZGVsLmxpbmVFdmVudHNbMl0uc3RhcnRQb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5saW5lRXZlbnRzWzNdLmZpbmlzaFBvcykpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQoY29tcGFyZUxpbmVQb3MobW9kZWwubGluZUV2ZW50c1syXS5maW5pc2hQb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5saW5lRXZlbnRzWzNdLnN0YXJ0UG9zKSk7XG5cbiAgICAvLyBQZXJmb3JtIGFjdGlvbiB1bmRlciB0ZXN0LiBVbmRvIGJhY2sgdG8gdGhlIHN0YXJ0LlxuICAgIHRvb2xiYXIuc2ltdWxhdGVCdXR0b25QcmVzcyhcInVuZG9cIik7XG4gICAgdG9vbGJhci5zaW11bGF0ZUJ1dHRvblByZXNzKFwidW5kb1wiKTtcblxuICAgIC8vIENvbmZpcm0gd2UgYXJlIG9uIHRyYWNrLlxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQobW9kZWwubGluZUV2ZW50cy5sZW5ndGggPT09IDYpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhci5idXR0b25TdGF0ZXMudW5kbyA9PT0gZmFsc2UpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhci5idXR0b25TdGF0ZXMucmVkbyA9PT0gdHJ1ZSk7XG5cbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KG1vZGVsLmxpbmVFdmVudHNbMV0uaWQgPT09IG1vZGVsLmxpbmVFdmVudHNbNF0uaWQpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQoY29tcGFyZUxpbmVQb3MobW9kZWwubGluZUV2ZW50c1sxXS5zdGFydFBvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLmxpbmVFdmVudHNbNF0uZmluaXNoUG9zKSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChjb21wYXJlTGluZVBvcyhtb2RlbC5saW5lRXZlbnRzWzFdLmZpbmlzaFBvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLmxpbmVFdmVudHNbNF0uc3RhcnRQb3MpKTtcblxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQobW9kZWwubGluZUV2ZW50c1swXS5pZCA9PT0gbW9kZWwubGluZUV2ZW50c1s1XS5pZCk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChjb21wYXJlTGluZVBvcyhtb2RlbC5saW5lRXZlbnRzWzBdLnN0YXJ0UG9zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwubGluZUV2ZW50c1s1XS5maW5pc2hQb3MpKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KGNvbXBhcmVMaW5lUG9zKG1vZGVsLmxpbmVFdmVudHNbMF0uZmluaXNoUG9zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwubGluZUV2ZW50c1s1XS5zdGFydFBvcykpO1xuXG4gICAgLy8gUGVyZm9ybSBhY3Rpb24gdW5kZXIgdGVzdC4gVW5kbyBwYXJ0IHN0YXJ0IG9mIGJ1ZmZlci5cbiAgICB0b29sYmFyLnNpbXVsYXRlQnV0dG9uUHJlc3MoXCJ1bmRvXCIpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQoXG4gICAgICBsb2dnZXIubGFzdFdhcm5bMF0gPT09XG4gICAgICAgIFwiVHJ5aW5nIHRvIHBlcmZvcm1Db21tYW5kIHBhc3QgZW5kIG9mIGJ1ZmZlci4gaW5kZXg6XCIgJiZcbiAgICAgIGxvZ2dlci5sYXN0V2FyblsxXSA9PT0gLTEpO1xuXG4gICAgdG9vbGJhci5zaW11bGF0ZUJ1dHRvblByZXNzKFwidW5kb1wiKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KFxuICAgICAgbG9nZ2VyLmxhc3RXYXJuWzBdID09PVxuICAgICAgICBcIlRyeWluZyB0byBwZXJmb3JtQ29tbWFuZCBwYXN0IGVuZCBvZiBidWZmZXIuIGluZGV4OlwiICYmXG4gICAgICBsb2dnZXIubGFzdFdhcm5bMV0gPT09IC0xKTtcbiAgfSxcblxuICB0ZXN0UmVkb0J1dHRvbjogKCkgPT4ge1xuICAgIGNvbnN0IG1vZGVsID0gbmV3IE1vZGVsTW9jaygpO1xuICAgIGNvbnN0IHdpZGdldDEgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCB3aWRnZXQyID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3QgdG9vbGJhciA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXJNb2NrKCk7XG4gICAgY29uc3QgY29udHJvbGxlciA9XG4gICAgICBuZXcgQ29udHJvbGxlcihtb2RlbCwgW3dpZGdldDEsIHdpZGdldDIsIHRvb2xiYXJdLCBsb2dnZXIpO1xuXG4gICAgY29uc3QgbGluZVBvc0ZpbmlzaDogSUxpbmVQb3MgPSB7XG4gICAgICBhOiB7eDo0LCB5OjUsIHo6Nn0sXG4gICAgICBiOiB7eDo0NCwgeTo1NSwgejo2Nn0sXG4gICAgfTtcblxuICAgIC8vIEFkZCBzb21lIGxpbmVzLlxuICAgIHdpZGdldDEuc2ltdWxhdGVMaW5lRXZlbnQobnVsbCwgbnVsbCwgbGluZVBvc0ZpbmlzaCk7XG4gICAgd2lkZ2V0MS5zaW11bGF0ZUxpbmVFdmVudChudWxsLCBudWxsLCBsaW5lUG9zRmluaXNoKTtcbiAgICB3aWRnZXQxLnNpbXVsYXRlTGluZUV2ZW50KG51bGwsIG51bGwsIGxpbmVQb3NGaW5pc2gpO1xuXG4gICAgLy8gQ29uZmlybSB3ZSBhcmUgb24gdHJhY2suXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChtb2RlbC5saW5lRXZlbnRzLmxlbmd0aCA9PT0gMyk7XG5cbiAgICAvLyBTdGVwIGJhY2sgdG8gdGhlIHN0YXJ0IG9mIGJ1ZmZlci5cbiAgICB0b29sYmFyLnNpbXVsYXRlQnV0dG9uUHJlc3MoXCJ1bmRvXCIpO1xuICAgIHRvb2xiYXIuc2ltdWxhdGVCdXR0b25QcmVzcyhcInVuZG9cIik7XG4gICAgdG9vbGJhci5zaW11bGF0ZUJ1dHRvblByZXNzKFwidW5kb1wiKTtcblxuICAgIC8vIENvbmZpcm0gd2UgYXJlIG9uIHRyYWNrLlxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQobW9kZWwubGluZUV2ZW50cy5sZW5ndGggPT09IDYpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQobW9kZWwubGluZUV2ZW50c1syXS5pZCA9PT0gbW9kZWwubGluZUV2ZW50c1szXS5pZCk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChjb21wYXJlTGluZVBvcyhtb2RlbC5saW5lRXZlbnRzWzJdLnN0YXJ0UG9zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwubGluZUV2ZW50c1szXS5maW5pc2hQb3MpKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KGNvbXBhcmVMaW5lUG9zKG1vZGVsLmxpbmVFdmVudHNbMl0uZmluaXNoUG9zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwubGluZUV2ZW50c1szXS5zdGFydFBvcykpO1xuXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChtb2RlbC5saW5lRXZlbnRzWzFdLmlkID09PSBtb2RlbC5saW5lRXZlbnRzWzRdLmlkKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KGNvbXBhcmVMaW5lUG9zKG1vZGVsLmxpbmVFdmVudHNbMV0uc3RhcnRQb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5saW5lRXZlbnRzWzRdLmZpbmlzaFBvcykpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQoY29tcGFyZUxpbmVQb3MobW9kZWwubGluZUV2ZW50c1sxXS5maW5pc2hQb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5saW5lRXZlbnRzWzRdLnN0YXJ0UG9zKSk7XG5cbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KG1vZGVsLmxpbmVFdmVudHNbMF0uaWQgPT09IG1vZGVsLmxpbmVFdmVudHNbNV0uaWQpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQoY29tcGFyZUxpbmVQb3MobW9kZWwubGluZUV2ZW50c1swXS5zdGFydFBvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLmxpbmVFdmVudHNbNV0uZmluaXNoUG9zKSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChjb21wYXJlTGluZVBvcyhtb2RlbC5saW5lRXZlbnRzWzBdLmZpbmlzaFBvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLmxpbmVFdmVudHNbNV0uc3RhcnRQb3MpKTtcblxuICAgIC8vIFBlcmZvcm0gYWN0aW9uIHVuZGVyIHRlc3QuXG4gICAgdG9vbGJhci5zaW11bGF0ZUJ1dHRvblByZXNzKFwicmVkb1wiKTtcbiAgICB0b29sYmFyLnNpbXVsYXRlQnV0dG9uUHJlc3MoXCJyZWRvXCIpO1xuICAgIHRvb2xiYXIuc2ltdWxhdGVCdXR0b25QcmVzcyhcInJlZG9cIik7XG5cbiAgICAvLyBDb25maXJtIHdlIGFyZSBvbiB0cmFjay5cbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KG1vZGVsLmxpbmVFdmVudHMubGVuZ3RoID09PSA5KTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KFxuICAgICAgY29tcGFyZUxpbmVFdmVudChtb2RlbC5saW5lRXZlbnRzWzBdLCBtb2RlbC5saW5lRXZlbnRzWzZdKSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChcbiAgICAgIGNvbXBhcmVMaW5lRXZlbnQobW9kZWwubGluZUV2ZW50c1sxXSwgbW9kZWwubGluZUV2ZW50c1s3XSkpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQoXG4gICAgICBjb21wYXJlTGluZUV2ZW50KG1vZGVsLmxpbmVFdmVudHNbMl0sIG1vZGVsLmxpbmVFdmVudHNbOF0pKTtcblxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQodG9vbGJhci5idXR0b25TdGF0ZXMudW5kbyA9PT0gdHJ1ZSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyLmJ1dHRvblN0YXRlcy5yZWRvID09PSBmYWxzZSk7XG5cbiAgICAvLyBQZXJmb3JtIGFjdGlvbiB1bmRlciB0ZXN0LiBUcnkgdG8gcmVkbyBwYXN0IGVuZCBvZiBidWZmZXIuXG4gICAgdG9vbGJhci5zaW11bGF0ZUJ1dHRvblByZXNzKFwicmVkb1wiKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KFxuICAgICAgbG9nZ2VyLmxhc3RXYXJuWzBdID09PVxuICAgICAgICBcIlRyeWluZyB0byBwZXJmb3JtQ29tbWFuZCBwYXN0IGVuZCBvZiBidWZmZXIuIGluZGV4OlwiICYmXG4gICAgICBsb2dnZXIubGFzdFdhcm5bMV0gPT09IDMpO1xuXG4gICAgdG9vbGJhci5zaW11bGF0ZUJ1dHRvblByZXNzKFwicmVkb1wiKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KFxuICAgICAgbG9nZ2VyLmxhc3RXYXJuWzBdID09PVxuICAgICAgICBcIlRyeWluZyB0byBwZXJmb3JtQ29tbWFuZCBwYXN0IGVuZCBvZiBidWZmZXIuIGluZGV4OlwiICYmXG4gICAgICBsb2dnZXIubGFzdFdhcm5bMV0gPT09IDMpO1xuXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyLmJ1dHRvblN0YXRlcy51bmRvID09PSB0cnVlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIuYnV0dG9uU3RhdGVzLnJlZG8gPT09IGZhbHNlKTtcbiAgfSxcblxuICB0ZXN0VW5kb0J1dHRvblRoZW5PdmVyd3JpdGU6ICgpID0+IHtcbiAgICBjb25zdCBtb2RlbCA9IG5ldyBNb2RlbE1vY2soKTtcbiAgICBjb25zdCB3aWRnZXQxID0gbmV3IFZpZXdNb2NrKCk7XG4gICAgY29uc3Qgd2lkZ2V0MiA9IG5ldyBWaWV3TW9jaygpO1xuICAgIGNvbnN0IHRvb2xiYXIgPSBuZXcgVmlld01vY2soKTtcbiAgICBjb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyTW9jaygpO1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPVxuICAgICAgbmV3IENvbnRyb2xsZXIobW9kZWwsIFt3aWRnZXQxLCB3aWRnZXQyLCB0b29sYmFyXSwgbG9nZ2VyKTtcblxuICAgIGNvbnN0IGxpbmVQb3NGaW5pc2g6IElMaW5lUG9zID0ge1xuICAgICAgYToge3g6NCwgeTo1LCB6OjZ9LFxuICAgICAgYjoge3g6NDQsIHk6NTUsIHo6NjZ9LFxuICAgIH07XG5cbiAgICAvLyBBZGQgc29tZSBsaW5lcy5cbiAgICB3aWRnZXQxLnNpbXVsYXRlTGluZUV2ZW50KG51bGwsIG51bGwsIGxpbmVQb3NGaW5pc2gpO1xuICAgIHdpZGdldDEuc2ltdWxhdGVMaW5lRXZlbnQobnVsbCwgbnVsbCwgbGluZVBvc0ZpbmlzaCk7XG4gICAgd2lkZ2V0MS5zaW11bGF0ZUxpbmVFdmVudChudWxsLCBudWxsLCBsaW5lUG9zRmluaXNoKTtcblxuICAgIC8vIENvbmZpcm0gd2UgYXJlIG9uIHRyYWNrLlxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQobW9kZWwubGluZUV2ZW50cy5sZW5ndGggPT09IDMpO1xuXG4gICAgLy8gU3RlcCBiYWNrIHRvIHRoZSBzdGFydCBvZiBidWZmZXIuXG4gICAgdG9vbGJhci5zaW11bGF0ZUJ1dHRvblByZXNzKFwidW5kb1wiKTtcbiAgICB0b29sYmFyLnNpbXVsYXRlQnV0dG9uUHJlc3MoXCJ1bmRvXCIpO1xuICAgIHRvb2xiYXIuc2ltdWxhdGVCdXR0b25QcmVzcyhcInVuZG9cIik7XG5cbiAgICAvLyBDb25maXJtIHdlIGFyZSBvbiB0cmFjay5cbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KG1vZGVsLmxpbmVFdmVudHMubGVuZ3RoID09PSA2KTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KG1vZGVsLmxpbmVFdmVudHNbMl0uaWQgPT09IG1vZGVsLmxpbmVFdmVudHNbM10uaWQpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQoY29tcGFyZUxpbmVQb3MobW9kZWwubGluZUV2ZW50c1syXS5zdGFydFBvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLmxpbmVFdmVudHNbM10uZmluaXNoUG9zKSk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChjb21wYXJlTGluZVBvcyhtb2RlbC5saW5lRXZlbnRzWzJdLmZpbmlzaFBvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGVsLmxpbmVFdmVudHNbM10uc3RhcnRQb3MpKTtcblxuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQobW9kZWwubGluZUV2ZW50c1sxXS5pZCA9PT0gbW9kZWwubGluZUV2ZW50c1s0XS5pZCk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChjb21wYXJlTGluZVBvcyhtb2RlbC5saW5lRXZlbnRzWzFdLnN0YXJ0UG9zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwubGluZUV2ZW50c1s0XS5maW5pc2hQb3MpKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KGNvbXBhcmVMaW5lUG9zKG1vZGVsLmxpbmVFdmVudHNbMV0uZmluaXNoUG9zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWwubGluZUV2ZW50c1s0XS5zdGFydFBvcykpO1xuXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChtb2RlbC5saW5lRXZlbnRzWzBdLmlkID09PSBtb2RlbC5saW5lRXZlbnRzWzVdLmlkKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KGNvbXBhcmVMaW5lUG9zKG1vZGVsLmxpbmVFdmVudHNbMF0uc3RhcnRQb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5saW5lRXZlbnRzWzVdLmZpbmlzaFBvcykpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQoY29tcGFyZUxpbmVQb3MobW9kZWwubGluZUV2ZW50c1swXS5maW5pc2hQb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RlbC5saW5lRXZlbnRzWzVdLnN0YXJ0UG9zKSk7XG5cbiAgICAvLyBQZXJmb3JtIGFjdGlvbiB1bmRlciB0ZXN0LiBBZGQgYW5vdGhlciBsaW5lLlxuICAgIHdpZGdldDEuc2ltdWxhdGVMaW5lRXZlbnQobnVsbCwgbnVsbCwgbGluZVBvc0ZpbmlzaCk7XG4gICAgXG4gICAgLy8gQ29uZmlybSB3ZSBhcmUgb24gdHJhY2suXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydChtb2RlbC5saW5lRXZlbnRzLmxlbmd0aCA9PT0gNyk7XG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyLmJ1dHRvblN0YXRlcy51bmRvID09PSB0cnVlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIuYnV0dG9uU3RhdGVzLnJlZG8gPT09IGZhbHNlKTtcblxuICAgIC8vIFBlcmZvcm0gYWN0aW9uIHVuZGVyIHRlc3QuIFRyeSB0byByZWRvIHBhc3QgZW5kIG9mIGJ1ZmZlci5cbiAgICB0b29sYmFyLnNpbXVsYXRlQnV0dG9uUHJlc3MoXCJyZWRvXCIpO1xuICAgIFRyYWNrQXNzZXJ0cy5hc3NlcnQoXG4gICAgICBsb2dnZXIubGFzdFdhcm5bMF0gPT09XG4gICAgICAgIFwiVHJ5aW5nIHRvIHBlcmZvcm1Db21tYW5kIHBhc3QgZW5kIG9mIGJ1ZmZlci4gaW5kZXg6XCIgJiZcbiAgICAgIGxvZ2dlci5sYXN0V2FyblsxXSA9PT0gMSk7XG4gICAgXG4gICAgVHJhY2tBc3NlcnRzLmFzc2VydCh0b29sYmFyLmJ1dHRvblN0YXRlcy51bmRvID09PSB0cnVlKTtcbiAgICBUcmFja0Fzc2VydHMuYXNzZXJ0KHRvb2xiYXIuYnV0dG9uU3RhdGVzLnJlZG8gPT09IGZhbHNlKTtcbiAgfSxcblxufTtcblxuIiwiLy8gQ29weXJpZ2h0IDIwMTcgZHVuY2FuIGxhdyAobXJkdW5rQGdtYWlsLmNvbSlcblxuaW1wb3J0IHtUcmFja0Fzc2VydHN9IGZyb20gXCIuL2NvbW1vbkZ1bmN0aW9uc3RUZXN0c1wiO1xuaW1wb3J0IHtcbiAgY29udHJvbGxlckJ1dHRvbkV2ZW50VGVzdHMsXG4gIGNvbnRyb2xsZXJDb21tYW5kSGlzdG9yeVRlc3RzLFxuICBjb250cm9sbGVyTGluZUV2ZW50VGVzdHMsXG59IGZyb20gXCIuL2NvbnRyb2xsZXJUZXN0c1wiO1xuXG5cbndpbmRvdy5vbmxvYWQgPSAoKSA9PiB7XG4gIGNvbnNvbGUubG9nKFwibWFpblRlc3RzLnRzXCIpO1xuICBjb25zdCBvdXRwdXRQYW5uZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRlc3RPdXRwdXRcIik7XG4gIG91dHB1dFBhbm5lbC5pbm5lckhUTUwgPSBcIlwiO1xuXG4gIGNvbnN0IHRlc3RTdWl0ZXMgPSB7XG4gICAgY29udHJvbGxlckJ1dHRvbkV2ZW50VGVzdHMsXG4gICAgY29udHJvbGxlckxpbmVFdmVudFRlc3RzLFxuICAgIGNvbnRyb2xsZXJDb21tYW5kSGlzdG9yeVRlc3RzLFxuICB9O1xuXG4gIGZvcihjb25zdCB0ZXN0U3VpdGVOYW1lIGluIHRlc3RTdWl0ZXMpIHtcbiAgICBpZighdGVzdFN1aXRlcy5oYXNPd25Qcm9wZXJ0eSh0ZXN0U3VpdGVOYW1lKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IHRlc3RTdWl0ZSA9IHRlc3RTdWl0ZXNbdGVzdFN1aXRlTmFtZV07XG5cbiAgICBmb3IoY29uc3QgdGVzdE5hbWUgaW4gdGVzdFN1aXRlKSB7XG4gICAgICBpZighdGVzdFN1aXRlLmhhc093blByb3BlcnR5KHRlc3ROYW1lKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRlc3QgPSB0ZXN0U3VpdGVbdGVzdE5hbWVdO1xuXG4gICAgICBUcmFja0Fzc2VydHMudmFsdWUgPSB0cnVlO1xuICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIG91dHB1dFBhbm5lbC5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICAgICAgdGVzdCgpO1xuICAgICAgaWYoVHJhY2tBc3NlcnRzLnZhbHVlKSB7XG4gICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFwidGVzdC1wYXNzXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoXCJ0ZXN0LWZhaWxcIik7XG4gICAgICB9XG4gICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gdGVzdFN1aXRlTmFtZSArIFwiLlwiICsgdGVzdC5uYW1lO1xuICAgIH1cbiAgfVxufTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IGR1bmNhbiBsYXcgKG1yZHVua0BnbWFpbC5jb20pXG5cbmltcG9ydCB7Q29udHJvbGxlciwgSUxpbmVFdmVudH0gZnJvbSBcIi4vY29udHJvbGxlclwiO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTW9kZWxCYXNlIHtcbiAgcHJpdmF0ZSBjb250cm9sbGVyOiBDb250cm9sbGVyO1xuICBwdWJsaWMgaW5pdChjb250cm9sbGVyOiBDb250cm9sbGVyKSB7XG4gICAgdGhpcy5jb250cm9sbGVyID0gY29udHJvbGxlcjtcbiAgfVxuXG4gIHB1YmxpYyBhYnN0cmFjdCBvbkxpbmVFdmVudChldmVudCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBNb2RlbCBleHRlbmRzIE1vZGVsQmFzZSB7XG4gIHByaXZhdGUgZGF0YSA9IHtcbiAgICBzaGlwOiB7fSxcbiAgfTtcblxuICBwdWJsaWMgb25MaW5lRXZlbnQoZXZlbnQpIHtcbiAgICAvLyBUT0RPLlxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBNb2RlbE1vY2sgZXh0ZW5kcyBNb2RlbEJhc2Uge1xuICBwdWJsaWMgbGluZUV2ZW50czogW0lMaW5lRXZlbnRdID0gKFtdIGFzIFtJTGluZUV2ZW50XSk7XG5cbiAgcHVibGljIG9uTGluZUV2ZW50KGV2ZW50OiBJTGluZUV2ZW50KSB7XG4gICAgdGhpcy5saW5lRXZlbnRzLnB1c2goZXZlbnQpO1xuICB9XG59XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBkdW5jYW4gbGF3IChtcmR1bmtAZ21haWwuY29tKVxuXG4vLyBpbXBvcnQgKiBhcyBLb252YSBmcm9tIFwia29udmFcIjtcbmltcG9ydCB7Q29udHJvbGxlciwgSUxpbmVFdmVudCwgSUxpbmVQb3N9IGZyb20gXCIuL2NvbnRyb2xsZXJcIjtcblxuZXhwb3J0IGNsYXNzIFZpZXdCYXNlIHtcbiAgcHJvdGVjdGVkIGNvbnRyb2xsZXI6IENvbnRyb2xsZXI7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLy9cbiAgfVxuXG4gIHB1YmxpYyBpbml0KGNvbnRyb2xsZXI6IENvbnRyb2xsZXIpIHtcbiAgICB0aGlzLmNvbnRyb2xsZXIgPSBjb250cm9sbGVyO1xuICB9XG5cbiAgcHVibGljIHNldEJ1dHRvblZhbHVlKGJ1dHRvbkxhYmVsOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuKSB7XG4gICAgLy9cbiAgfVxuXG4gIHB1YmxpYyBzZXRCdXR0b25TdGF0ZShidXR0b25MYWJlbDogc3RyaW5nLCBzdGF0ZTogYm9vbGVhbikge1xuICAgIC8vXG4gIH1cbn1cblxuaW50ZXJmYWNlIElIYXNoIHtcbiAgW2tleTogc3RyaW5nXTogYW55O1xufVxuXG5leHBvcnQgY2xhc3MgVmlld01vY2sgZXh0ZW5kcyBWaWV3QmFzZSB7XG4gIHB1YmxpYyBidXR0b25WYWx1ZXM6IElIYXNoID0ge307XG4gIHB1YmxpYyBidXR0b25TdGF0ZXM6IElIYXNoID0ge307XG5cbiAgcHVibGljIHNldEJ1dHRvblZhbHVlKGJ1dHRvbkxhYmVsOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5idXR0b25WYWx1ZXNbYnV0dG9uTGFiZWxdID0gdmFsdWU7XG4gIH1cblxuICBwdWJsaWMgc2V0QnV0dG9uU3RhdGUoYnV0dG9uTGFiZWw6IHN0cmluZywgc3RhdGU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmJ1dHRvblN0YXRlc1tidXR0b25MYWJlbF0gPSBzdGF0ZTtcbiAgfVxuXG4gIHB1YmxpYyBzaW11bGF0ZUJ1dHRvblByZXNzKGJ1dHRvbkxhYmVsOiBzdHJpbmcpIHtcbiAgICB0aGlzLmNvbnRyb2xsZXIub25CdXR0b25FdmVudChidXR0b25MYWJlbCk7XG4gIH1cblxuICBwdWJsaWMgc2ltdWxhdGVMaW5lRXZlbnQoaWQ6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0UG9zOiBJTGluZVBvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbmlzaFBvczogSUxpbmVQb3MpIHtcbiAgICBjb25zdCBldmVudDogSUxpbmVFdmVudCA9IHtcbiAgICAgIGlkLFxuICAgICAgc3RhcnRQb3MsXG4gICAgICBmaW5pc2hQb3MsXG4gICAgfTtcbiAgICB0aGlzLmNvbnRyb2xsZXIub25MaW5lRXZlbnQoZXZlbnQpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBWaWV3VG9vbGJhciBleHRlbmRzIFZpZXdCYXNlIHtcbiAgcHJpdmF0ZSBidXR0b25FbGVtZW50czogRWxlbWVudFtdO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgY29uc29sZS5sb2coXCJWaWV3VG9vbGJhcigpXCIpO1xuXG4gICAgdGhpcy5idXR0b25FbGVtZW50cyA9XG4gICAgICBbXS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIucHVyZS1idXR0b25cIikpO1xuICAgIHRoaXMuYnV0dG9uRWxlbWVudHMuZm9yRWFjaCgoYnV0dG9uKSA9PiB7XG4gICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMub25DbGljay5iaW5kKHRoaXMpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRCdXR0b25WYWx1ZShidXR0b25MYWJlbDogc3RyaW5nLCB2YWx1ZTogYm9vbGVhbikge1xuICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuZ2V0QnV0dG9uQnlMYWJlbChidXR0b25MYWJlbCk7XG4gICAgaWYoYnV0dG9uKSB7XG4gICAgICBpZih2YWx1ZSkge1xuICAgICAgICBidXR0b24uY2xhc3NMaXN0LmFkZChcInB1cmUtYnV0dG9uLWFjdGl2ZVwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwicHVyZS1idXR0b24tYWN0aXZlXCIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzZXRCdXR0b25TdGF0ZShidXR0b25MYWJlbDogc3RyaW5nLCBzdGF0ZTogYm9vbGVhbikge1xuICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuZ2V0QnV0dG9uQnlMYWJlbChidXR0b25MYWJlbCk7XG4gICAgaWYoYnV0dG9uKSB7XG4gICAgICBpZihzdGF0ZSkge1xuICAgICAgICBidXR0b24uY2xhc3NMaXN0LnJlbW92ZShcInB1cmUtYnV0dG9uLWRpc2FibGVkXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJwdXJlLWJ1dHRvbi1kaXNhYmxlZFwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uQ2xpY2soZXZlbnQ6IEV2ZW50KSB7XG4gICAgY29uc3QgYnV0dG9uID0gZXZlbnQuY3VycmVudFRhcmdldCBhcyBFbGVtZW50O1xuICAgIGNvbnN0IGJ1dHRvbkxhYmVsID0gYnV0dG9uLmdldEF0dHJpYnV0ZShcImxhYmVsXCIpO1xuICAgIHRoaXMuY29udHJvbGxlci5vbkJ1dHRvbkV2ZW50KGJ1dHRvbkxhYmVsKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0QnV0dG9uQnlMYWJlbChidXR0b25MYWJlbDogc3RyaW5nKTogRWxlbWVudCB7XG4gICAgbGV0IHJldHVybkJ1dHRvbjogRWxlbWVudDtcbiAgICB0aGlzLmJ1dHRvbkVsZW1lbnRzLmZvckVhY2goKGJ1dHRvbikgPT4ge1xuICAgICAgaWYoYnV0dG9uTGFiZWwgPT09IGJ1dHRvbi5nZXRBdHRyaWJ1dGUoXCJsYWJlbFwiKSkge1xuICAgICAgICByZXR1cm5CdXR0b24gPSBidXR0b247XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJldHVybkJ1dHRvbjtcbiAgfVxufVxuIl19
