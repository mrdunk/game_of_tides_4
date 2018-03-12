// Copyright 2017 duncan law (mrdunk@gmail.com)

import {LoggerMock, TrackAsserts} from "./commonFunctionstTests";
import {
  compareLineEvent,
  compareLinePos,
  comparePoint,
  ILine,
  ILinePos,
  IPoint,
  TestController,
} from "./controller";
import {
  EventBase,
  EventUiInputElement,
  EventUiMouseDrag,
  EventUiMouseMove,
  EventUiSelectRib,
  LineEnd } from "./events";
import {ModelMock} from "./model";
import {ViewMock} from "./view";

export const controllerButtonEventTests = {
  testInvalidButton: () => {
    const model = null;
    const toolbar1 = new ViewMock();
    const toolbar2 = new ViewMock();
    const logger = new LoggerMock();
    const controller = new TestController(model, [toolbar1, toolbar2], logger);

    const buttonLabel = "someInvalidButton";

    // Perform action under test.
    toolbar1.simulateButtonPress(buttonLabel);

    TrackAsserts.assert(
      logger.lastWarn &&
      logger.lastWarn[0] === "Invalid buttonLabel:" &&
      logger.lastWarn[1] === buttonLabel);
    TrackAsserts.assert(toolbar1.buttonValues[buttonLabel] === undefined);
    TrackAsserts.assert(toolbar2.buttonValues[buttonLabel] === undefined);
  },

  testRegularButton: () => {
    const model = null;
    const toolbar1 = new ViewMock();
    const toolbar2 = new ViewMock();
    const logger = new LoggerMock();
    const controller = new TestController(model, [toolbar1, toolbar2], logger);

    const buttonLabel = "clear";

    // Perform action under test.
    toolbar1.simulateButtonPress(buttonLabel);

    // Since this button does not stay depressed,
    // there is nothing to update on the view object.
    TrackAsserts.assert(toolbar1.buttonValues[buttonLabel] === undefined);
    TrackAsserts.assert(toolbar2.buttonValues[buttonLabel] === undefined);
  },

  testSingleToggleButton: () => {
    const model = null;
    const toolbar1 = new ViewMock();
    const toolbar2 = new ViewMock();
    const logger = new LoggerMock();
    const controller = new TestController(model, [toolbar1, toolbar2], logger);

    const buttonLabel = "allLayers";

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

  testPairedToggleButtons: () => {
    const model = null;
    const toolbar1 = new ViewMock();
    const toolbar2 = new ViewMock();
    const logger = new LoggerMock();
    const controller = new TestController(model, [toolbar1, toolbar2], logger);

    // Only one of these buttons can be toggled at once.
    const buttonLabel1 = "addLine";
    const buttonLabel2 = "delete";
    const buttonLabel3 = "mirror";

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
};

export const controllerLineEventTests = {
  testNewInvalidLine: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    // Perform action under test.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_4",
      startPoint: null,
      finishPoint: null,
    }));

    TrackAsserts.assert(model.lineEvents.length === 0);
    TrackAsserts.assert(
      logger.lastWarn &&
      logger.lastWarn[0] ===
        "Missing startPoint or finishPoint for new line: " &&
      logger.lastWarn[1] === undefined);
  },

  testInvalidLine: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    // Perform action under test.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      lineId: "testLineId",
      sequence: "sequence_1",
      startPoint: null,
      finishPoint: null,
    }));

    TrackAsserts.assert(model.lineEvents.length === 0);
    TrackAsserts.assert(
      logger.lastWarn &&
      logger.lastWarn[0] ===
        "Missing startPoint or finishPoint for modified line: " &&
      logger.lastWarn[1] === "testLineId");
  },

  testSetHighlight: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    // Perform action under test.
    widget1.simulateLineEvent(new EventUiMouseMove({
      widgetType: widget1.widgetType,
      lineId: "testLineId",
      startPoint: null,
    }));

    TrackAsserts.assert(model.lineEvents.length === 1);
    TrackAsserts.assert(
      model.lineEvents[0].constructor.name === "EventLineHighlight");
    TrackAsserts.assert(toolbar.buttonStates.undo === false);
    TrackAsserts.assert(toolbar.buttonStates.redo === false);
  },

  testNewInvalidLineMissingPoint: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    const linePos: ILinePos = {
      a: {x:1, y:2, z:3},
      b: null,
    };

    // Perform action under test.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_1",
      startPoint: linePos.a,
      finishPoint: null,
    }));

    TrackAsserts.assert(model.lineEvents.length === 0);
    TrackAsserts.assert(
      logger.lastWarn &&
      logger.lastWarn[0] ===
        "Missing startPoint or finishPoint for new line: " &&
      logger.lastWarn[1] === undefined);

    // Perform action under test again.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_1",
      startPoint: null,
      finishPoint: linePos.b,
    }));

    TrackAsserts.assert(model.lineEvents.length === 0);
    TrackAsserts.assert(
      logger.lastWarn &&
      logger.lastWarn[0] ===
        "Missing startPoint or finishPoint for new line: " &&
      logger.lastWarn[1] === undefined);
  },

  testMoveLineMissingEnd: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    const startPoint = {x:1, y:2, z:3};
    const finishPoint = {x:11, y:22, z:33};

    // Perform action under test.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      lineId: "someId",
      sequence: "sequence_1",
      startPoint,
      finishPoint,
    }));

    TrackAsserts.assert(model.lineEvents.length === 0);
    TrackAsserts.assert(
      logger.lastWarn &&
      logger.lastWarn[0] ===
        "Modified end not specified on line: " &&
      logger.lastWarn[1] === "someId");
  },

  testMoveLine: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    const startPoint = {x:1, y:2, z:3};
    const finishPoint = {x:11, y:22, z:33};

    // Perform action under test.
    // Although this is moving a line that does not actually exist on the model,
    // it is not up to the controller to police this so the test passes.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      lineId: "someId",
      lineEnd: LineEnd.A1,
      sequence: "sequence_1",
      startPoint,
      finishPoint,
    }));

    TrackAsserts.assert(model.lineEvents.length === 1);
    TrackAsserts.assert(
      model.lineEvents[0].constructor.name === "EventLineModify");
    TrackAsserts.assert(toolbar.buttonStates.undo === true);
    TrackAsserts.assert(toolbar.buttonStates.redo === false);
  },

  testDeleteLine: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    const linePos: ILinePos = {
      a: {x:1, y:2, z:3},
      b: {x:11, y:22, z:33},
    };
    const line1: ILine = {
      id: "testLine_1",
      finishPos: linePos,
      selected: true,
    };
    const line2: ILine = {
      id: "testLine_2",
      finishPos: linePos,
      selected: true,
    };
    model.mockGetSelectedLines = [line1, line2];

    // Perform action under test.
    widget1.simulateButtonPress("delete");

    TrackAsserts.assert(model.lineEvents.length === 2);
    TrackAsserts.assert(
      model.lineEvents[0].constructor.name === "EventLineDelete");
    TrackAsserts.assert(
      model.lineEvents[1].constructor.name === "EventLineDelete");
    TrackAsserts.assert(toolbar.buttonStates.undo === true);
    TrackAsserts.assert(toolbar.buttonStates.redo === false);
  },

  testNewLine: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    const startPoint = {x:1, y:2, z:3};
    const finishPoint = {x:11, y:22, z:33};

    // Perform action under test.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_1",
      startPoint,
      finishPoint,
    }));

    TrackAsserts.assert(model.lineEvents.length === 1);
    TrackAsserts.assert(
      model.lineEvents[0].constructor.name === "EventLineNew");

    TrackAsserts.assert(toolbar.buttonStates.undo === true);
    TrackAsserts.assert(toolbar.buttonStates.redo === false);
  },

  testMultipleNewLines: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    const startPoint = {x:1, y:2, z:3};
    const finishPoint = {x:11, y:22, z:33};

    // Add some lines.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_1",
      startPoint,
      finishPoint,
    }));
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_2",
      startPoint,
      finishPoint,
    }));
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_3",
      startPoint,
      finishPoint,
    }));

    TrackAsserts.assert(model.lineEvents.length === 3);
    TrackAsserts.assert(toolbar.buttonStates.undo === true);
    TrackAsserts.assert(toolbar.buttonStates.redo === false);
  },

  testEventSequenceCollapse: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    const startPoint = {x:1, y:2, z:3};
    const finishPoint = {x:11, y:22, z:33};

    // Add some line commands with same sequence.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_1",
      startPoint,
      finishPoint,
    }));
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_1",
      startPoint,
      finishPoint,
    }));
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_1",
      startPoint,
      finishPoint,
    }));

    // Confirm lines with matching sequence collapsed into one.
    TrackAsserts.assert(controller.commands.length === 1);

    // Add some more lines with different.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_2",
      startPoint,
      finishPoint,
    }));
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_2",
      startPoint,
      finishPoint,
    }));
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_2",
      startPoint,
      finishPoint,
    }));

    // Confirm lines they collapsed.
    TrackAsserts.assert(controller.commands.length === 2);
  },

  testNewMirroredLine: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    const linePos: ILinePos = {
      a: {x:1, y:2, z:3},
      b: {x:11, y:22, z:33},
    };
    const line1: ILine = {
      id: "testLine_1",
      finishPos: linePos,
      selected: true,
    };
    const line2: ILine = {
      id: "testLine_2",
      finishPos: linePos,
      selected: true,
    };
    model.mockGetSelectedLines = [line1, line2];

    // Perform action under test.
    widget1.simulateButtonPress("mirror");

    TrackAsserts.assert(model.lineEvents.length === 2);
    TrackAsserts.assert(
      model.lineEvents[0].constructor.name === "EventLineMirror");
    TrackAsserts.assert(
      model.lineEvents[1].constructor.name === "EventLineMirror");
    TrackAsserts.assert(toolbar.buttonStates.undo === true);
    TrackAsserts.assert(toolbar.buttonStates.redo === false);
  },

  testSnapMirroredLineToNonMirrored: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    const linePosStart: ILinePos = {
      a: {x:24, y:25, z:66},
      b: {x:44, y:55, z:66},
    };
    const linePosFinish: ILinePos = {
      a: {x:24, y:25, z:66},
      b: {x:44, y:55, z:66},
    };

    // Force model to return a specific result.
    model.mockGetLineValue = {
      id: "drawnLine_1",
      finishPos: linePosFinish,
      mirrored: true,
    };

    // Modify line.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      lineId: "drawnLine_1",
      lineEnd: LineEnd.A1,
      widgetType: widget1.widgetType,
      sequence: "sequence_2",
      startPoint: linePosStart.a,
      finishPoint: linePosFinish.a,
    }));

    // Confirm correct so far. (No snapping yet.)
    TrackAsserts.assert(model.lineEvents.length === 1);
    TrackAsserts.assert(comparePoint(
      linePosFinish.a, (model.lineEvents[0] as EventUiMouseDrag).finishPoint));

    // Set a nearby line to snap() to.
    const linePosNearby: ILinePos = {
      a: {x:23, y:24, z:66},
      b: {x:144, y:155, z:66},
    };
    model.mockNearestLine = {point: linePosNearby.a, mirrored: false};

    // Modify line.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      lineId: "drawnLine_1",
      lineEnd: LineEnd.A1,
      widgetType: widget1.widgetType,
      sequence: "sequence_2",
      startPoint: linePosStart.a,
      finishPoint: linePosFinish.a,
    }));

    // Confirm correct so far.
    TrackAsserts.assert(model.lineEvents.length === 2);
    // This time line has snapped "a" end to linePosNearby.
    TrackAsserts.assert(comparePoint(
      linePosNearby.a, (model.lineEvents[1] as EventUiMouseDrag).finishPoint));

    // Set a nearby mirrored line to snap() to.
    const linePosMirrorNear: ILinePos = {
      a: {x:124, y:125, z:166},
      b: {x:43, y:55, z:66},
    };
    model.mockNearestLine = {point: linePosMirrorNear.b, mirrored: false};

    // Modify line.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      lineId: "drawnLine_1",
      lineEnd: LineEnd.B1,
      widgetType: widget1.widgetType,
      sequence: "sequence_2",
      startPoint: linePosStart.b,
      finishPoint: linePosFinish.b,
    }));

    // Confirm correct.
    TrackAsserts.assert(model.lineEvents.length === 3);
    // This time line has snapped "b" end to linePosNearby.
    TrackAsserts.assert(comparePoint(
      linePosMirrorNear.b,
      (model.lineEvents[2] as EventUiMouseDrag).finishPoint));
  },

  testSnapLineToMirrored: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    const linePosStart: ILinePos = {
      a: {x:24, y:25, z:66},
      b: {x:44, y:55, z:66},
    };
    const linePosFinish: ILinePos = {
      a: {x:24, y:25, z:66},
      b: {x:44, y:55, z:66},
    };

    // Force model to return a specific result.
    model.mockGetLineValue = {
      id: "drawnLine_1",
      finishPos: linePosFinish,
      mirrored: false,
    };

    // Modify line.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      lineId: "drawnLine_1",
      lineEnd: LineEnd.A1,
      widgetType: widget1.widgetType,
      sequence: "sequence_2",
      startPoint: linePosStart.a,
      finishPoint: linePosFinish.a,
    }));

    // Confirm correct so far.
    TrackAsserts.assert(model.lineEvents.length === 1);
    TrackAsserts.assert(comparePoint(
      linePosFinish.a, (model.lineEvents[0] as EventUiMouseDrag).finishPoint));

    // Set a nearby line to snap() to.
    const linePosNearby: ILinePos = {
      a: {x:23, y:24, z:66},
      b: {x:144, y:155, z:66},
    };
    model.mockNearestLine = {point: linePosNearby.a, mirrored: true};

    // Modify line.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      lineId: "drawnLine_1",
      lineEnd: LineEnd.A1,
      widgetType: widget1.widgetType,
      sequence: "sequence_2",
      startPoint: linePosStart.a,
      finishPoint: linePosFinish.a,
    }));

    // Confirm correct so far.
    TrackAsserts.assert(model.lineEvents.length === 2);
    // This time line has snapped "a" end to linePosNearby.
    TrackAsserts.assert(comparePoint(
      linePosNearby.a, (model.lineEvents[1] as EventUiMouseDrag).finishPoint));

    // Set a nearby mirrored line to snap() to.
    const linePosMirrorNear: ILinePos = {
      a: {x:124, y:125, z:166},
      b: {x:-43, y:55, z:66},
    };
    const linePosMirrorNearPartner: ILinePos = {
      a: {x:124, y:125, z:166},
      b: {x:43, y:55, z:66},
    };
    model.mockNearestLine = {point: linePosMirrorNear.b, mirrored: true};

    // Modify line.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      lineId: "drawnLine_1",
      lineEnd: LineEnd.B1,
      widgetType: widget1.widgetType,
      sequence: "sequence_2",
      startPoint: linePosStart.b,
      finishPoint: linePosFinish.b,
    }));

    // Confirm correct so far.
    TrackAsserts.assert(model.lineEvents.length === 3);
    // This time line has snapped "b" end to linePosMirrorNearPartner.
    TrackAsserts.assert(comparePoint(
      linePosMirrorNearPartner.b,
      (model.lineEvents[2] as EventUiMouseDrag).finishPoint));
  },

  testSnapLineToCentre: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    const linePosStart: ILinePos = {
      a: {x:24, y:25, z:66},
      b: {x:44, y:55, z:66},
    };
    const linePosFinish: ILinePos = {
      a: {x:4, y:25, z:66},
      b: {x:44, y:55, z:66},
    };

    // Set a line too far away to snap() to.
    const linePosNearby: ILinePos = {
      a: {x:223, y:224, z:66},
      b: {x:244, y:255, z:66},
    };
    model.mockNearestLine = {point: linePosNearby.a, mirrored: true};

    // Force model to return non-mirroring result.
    model.mockGetLineValue = {
      id: "drawnLine_1",
      finishPos: linePosFinish,
      mirrored: false,
    };

    // Modify line.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      lineId: "drawnLine_1",
      lineEnd: LineEnd.A1,
      widgetType: widget1.widgetType,
      sequence: "sequence_2",
      startPoint: linePosStart.a,
      finishPoint: linePosFinish.a,
    }));

    // Confirm correct so far.
    TrackAsserts.assert(model.lineEvents.length === 1);
    // Should not have snapped anything.
    // (Not mirrored so didn't snap to centre and nothing else close enough.)
    TrackAsserts.assert(comparePoint(
      linePosFinish.a, (model.lineEvents[0] as EventUiMouseDrag).finishPoint));

    // Force model to return a mirrored result.
    model.mockGetLineValue = {
      id: "drawnLine_1",
      finishPos: linePosFinish,
      mirrored: true,
    };

    // Modify line.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      lineId: "drawnLine_1",
      lineEnd: LineEnd.A1,
      widgetType: widget1.widgetType,
      sequence: "sequence_2",
      startPoint: linePosStart.a,
      finishPoint: linePosFinish.a,
    }));

    // Confirm correct so far.
    TrackAsserts.assert(model.lineEvents.length === 2);
    // This time line has snapped "a" end to linePosNearby.
    TrackAsserts.assert(comparePoint(
      {x:0, y:25, z:66},
      (model.lineEvents[1] as EventUiMouseDrag).finishPoint));
  },

};

export const controllerCommandHistoryTests = {
  testUndoButton: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    const linePosFinish: ILinePos = {
      a: {x:4, y:5, z:6},
      b: {x:44, y:55, z:66},
    };

    // Add some lines.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_1",
      startPoint: linePosFinish.a,
      finishPoint: linePosFinish.b,
    }));
    const lineId = (model.lineEvents[0] as EventUiMouseDrag).lineId;
    const lineEnd = (model.lineEvents[0] as EventUiMouseDrag).lineEnd;
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      lineId,
      lineEnd,
      sequence: "sequence_2",
      startPoint: linePosFinish.a,
      finishPoint: linePosFinish.b,
    }));
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      lineId,
      lineEnd,
      sequence: "sequence_3",
      startPoint: linePosFinish.a,
      finishPoint: linePosFinish.b,
    }));

    // Confirm we are on track.
    TrackAsserts.assert(model.lineEvents.length === 3);
    TrackAsserts.assert(toolbar.buttonStates.undo === true);
    TrackAsserts.assert(toolbar.buttonStates.redo === false);
    TrackAsserts.assert(
      model.lineEvents[0].constructor.name === "EventLineNew");
    TrackAsserts.assert(
      model.lineEvents[1].constructor.name === "EventLineModify");
    TrackAsserts.assert(
      model.lineEvents[2].constructor.name === "EventLineModify");

    // Perform action under test.
    toolbar.simulateButtonPress("undo");

    // Confirm we are on track.
    TrackAsserts.assert(model.lineEvents.length === 4);
    TrackAsserts.assert(toolbar.buttonStates.undo === true);
    TrackAsserts.assert(toolbar.buttonStates.redo === true);
    TrackAsserts.assert(
      model.lineEvents[3].constructor.name === "EventLineModify");
    TrackAsserts.assert(
      (model.lineEvents[2] as EventUiMouseDrag).lineId ===
      (model.lineEvents[3] as EventUiMouseDrag).lineId);
    TrackAsserts.assert(
      comparePoint((model.lineEvents[2] as EventUiMouseDrag).startPoint,
                   (model.lineEvents[3] as EventUiMouseDrag).finishPoint));
    TrackAsserts.assert(
      comparePoint((model.lineEvents[2] as EventUiMouseDrag).finishPoint,
                   (model.lineEvents[3] as EventUiMouseDrag).startPoint));

    // Perform action under test. Undo back to the start.
    toolbar.simulateButtonPress("undo");
    toolbar.simulateButtonPress("undo");

    // Confirm we are on track.
    TrackAsserts.assert(model.lineEvents.length === 6);
    TrackAsserts.assert(toolbar.buttonStates.undo === false);
    TrackAsserts.assert(toolbar.buttonStates.redo === true);

    TrackAsserts.assert(
      model.lineEvents[4].constructor.name === "EventLineModify");
    TrackAsserts.assert(
      (model.lineEvents[2] as EventUiMouseDrag).lineId ===
      (model.lineEvents[4] as EventUiMouseDrag).lineId);
    TrackAsserts.assert(
      comparePoint((model.lineEvents[2] as EventUiMouseDrag).startPoint,
                   (model.lineEvents[4] as EventUiMouseDrag).finishPoint));
    TrackAsserts.assert(
      comparePoint((model.lineEvents[2] as EventUiMouseDrag).finishPoint,
                   (model.lineEvents[4] as EventUiMouseDrag).startPoint));

    TrackAsserts.assert(
      model.lineEvents[5].constructor.name === "EventLineDelete");
    TrackAsserts.assert(
      (model.lineEvents[2] as EventUiMouseDrag).lineId ===
      (model.lineEvents[5] as EventUiMouseDrag).lineId);

    // Perform action under test. Undo part start of buffer.
    toolbar.simulateButtonPress("undo");
    TrackAsserts.assert(
      logger.lastWarn &&
      logger.lastWarn[0] ===
        "Trying to undoCommand past end of buffer. index:" &&
      logger.lastWarn[1] === -1);

    toolbar.simulateButtonPress("undo");
    TrackAsserts.assert(
      logger.lastWarn &&
      logger.lastWarn[0] ===
        "Trying to undoCommand past end of buffer. index:" &&
      logger.lastWarn[1] === -1);
  },

  testRedoButton: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    const linePosFinish: ILinePos = {
      a: {x:4, y:5, z:6},
      b: {x:44, y:55, z:66},
    };

    // Add some lines.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_1",
      startPoint: linePosFinish.a,
      finishPoint: linePosFinish.b,
    }));
    const lineId = (model.lineEvents[0] as EventUiMouseDrag).lineId;
    const lineEnd = (model.lineEvents[0] as EventUiMouseDrag).lineEnd;
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      lineId,
      lineEnd,
      sequence: "sequence_2",
      startPoint: linePosFinish.a,
      finishPoint: linePosFinish.b,
    }));
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      lineId,
      lineEnd,
      sequence: "sequence_3",
      startPoint: linePosFinish.a,
      finishPoint: linePosFinish.b,
    }));

    // Confirm we are on track.
    TrackAsserts.assert(model.lineEvents.length === 3);

    // Step back to the start of buffer.
    toolbar.simulateButtonPress("undo");
    toolbar.simulateButtonPress("undo");
    toolbar.simulateButtonPress("undo");

    // Confirm we are on track.
    TrackAsserts.assert(model.lineEvents.length === 6);

    TrackAsserts.assert(
      model.lineEvents[3].constructor.name === "EventLineModify");
    TrackAsserts.assert(
      (model.lineEvents[2] as EventUiMouseDrag).lineId ===
      (model.lineEvents[3] as EventUiMouseDrag).lineId);
    TrackAsserts.assert(
      comparePoint((model.lineEvents[2] as EventUiMouseDrag).startPoint,
                   (model.lineEvents[3] as EventUiMouseDrag).finishPoint));
    TrackAsserts.assert(
      comparePoint((model.lineEvents[2] as EventUiMouseDrag).finishPoint,
                   (model.lineEvents[3] as EventUiMouseDrag).startPoint));

    TrackAsserts.assert(
      model.lineEvents[4].constructor.name === "EventLineModify");
    TrackAsserts.assert(
      (model.lineEvents[1] as EventUiMouseDrag).lineId ===
      (model.lineEvents[4] as EventUiMouseDrag).lineId);
    TrackAsserts.assert(
      comparePoint((model.lineEvents[1] as EventUiMouseDrag).startPoint,
                   (model.lineEvents[4] as EventUiMouseDrag).finishPoint));
    TrackAsserts.assert(
      comparePoint((model.lineEvents[1] as EventUiMouseDrag).finishPoint,
                   (model.lineEvents[4] as EventUiMouseDrag).startPoint));

    TrackAsserts.assert(
      model.lineEvents[5].constructor.name === "EventLineDelete");
    TrackAsserts.assert((model.lineEvents[0] as EventUiMouseDrag).lineId ===
                        (model.lineEvents[5] as EventUiMouseDrag).lineId);

    // Perform action under test.
    toolbar.simulateButtonPress("redo");
    toolbar.simulateButtonPress("redo");
    toolbar.simulateButtonPress("redo");

    // Confirm we are on track.
    TrackAsserts.assert(model.lineEvents.length === 9);
    TrackAsserts.assert(
      compareLineEvent((model.lineEvents[0] as EventUiMouseDrag),
                       (model.lineEvents[6] as EventUiMouseDrag)));
    TrackAsserts.assert(
      compareLineEvent((model.lineEvents[1] as EventUiMouseDrag),
                       (model.lineEvents[7] as EventUiMouseDrag)));
    TrackAsserts.assert(
      compareLineEvent((model.lineEvents[2] as EventUiMouseDrag),
                       (model.lineEvents[8] as EventUiMouseDrag)));

    TrackAsserts.assert(toolbar.buttonStates.undo === true);
    TrackAsserts.assert(toolbar.buttonStates.redo === false);

    // Perform action under test. Try to redo past end of buffer.
    toolbar.simulateButtonPress("redo");
    TrackAsserts.assert(
      logger.lastWarn &&
      logger.lastWarn[0] ===
        "Trying to performCommand past end of buffer. index:" &&
      logger.lastWarn[1] === 3);

    toolbar.simulateButtonPress("redo");
    TrackAsserts.assert(
      logger.lastWarn &&
      logger.lastWarn[0] ===
        "Trying to performCommand past end of buffer. index:" &&
      logger.lastWarn[1] === 3);

    TrackAsserts.assert(toolbar.buttonStates.undo === true);
    TrackAsserts.assert(toolbar.buttonStates.redo === false);
  },

  testUndoButtonThenOverwrite: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    const linePosFinish: ILinePos = {
      a: {x:4, y:5, z:6},
      b: {x:44, y:55, z:66},
    };

    // Add some lines.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_1",
      startPoint: linePosFinish.a,
      finishPoint: linePosFinish.b,
    }));
    const lineId = (model.lineEvents[0] as EventUiMouseDrag).lineId;
    const lineEnd = (model.lineEvents[0] as EventUiMouseDrag).lineEnd;
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      lineId,
      lineEnd,
      sequence: "sequence_2",
      startPoint: linePosFinish.a,
      finishPoint: linePosFinish.b,
    }));
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      lineId,
      lineEnd,
      sequence: "sequence_3",
      startPoint: linePosFinish.a,
      finishPoint: linePosFinish.b,
    }));

    // Confirm we are on track.
    TrackAsserts.assert(model.lineEvents.length === 3);

    // Step back to the start of buffer.
    toolbar.simulateButtonPress("undo");
    toolbar.simulateButtonPress("undo");
    toolbar.simulateButtonPress("undo");

    // Confirm we are on track.
    TrackAsserts.assert(model.lineEvents.length === 6);

    TrackAsserts.assert(
      model.lineEvents[3].constructor.name === "EventLineModify");
    TrackAsserts.assert((model.lineEvents[2] as EventUiMouseDrag).lineId ===
                        (model.lineEvents[3] as EventUiMouseDrag).lineId);
    TrackAsserts.assert(
      comparePoint((model.lineEvents[2] as EventUiMouseDrag).startPoint,
                   (model.lineEvents[3] as EventUiMouseDrag).finishPoint));
    TrackAsserts.assert(
      comparePoint((model.lineEvents[2] as EventUiMouseDrag).finishPoint,
                   (model.lineEvents[3] as EventUiMouseDrag).startPoint));

    TrackAsserts.assert(
      model.lineEvents[4].constructor.name === "EventLineModify");
    TrackAsserts.assert((model.lineEvents[1] as EventUiMouseDrag).lineId ===
                        (model.lineEvents[4] as EventUiMouseDrag).lineId);
    TrackAsserts.assert(
      comparePoint((model.lineEvents[1] as EventUiMouseDrag).startPoint,
                   (model.lineEvents[4] as EventUiMouseDrag).finishPoint));
    TrackAsserts.assert(
      comparePoint((model.lineEvents[1] as EventUiMouseDrag).finishPoint,
                   (model.lineEvents[4] as EventUiMouseDrag).startPoint));

    TrackAsserts.assert(
      model.lineEvents[5].constructor.name === "EventLineDelete");
    TrackAsserts.assert((model.lineEvents[0] as EventUiMouseDrag).lineId ===
                        (model.lineEvents[5] as EventUiMouseDrag).lineId);

    // Perform action under test. Add another line.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_4",
      startPoint: linePosFinish.a,
      finishPoint: linePosFinish.b,
    }));

    // Confirm we are on track.
    TrackAsserts.assert(model.lineEvents.length === 7);
    TrackAsserts.assert(toolbar.buttonStates.undo === true);
    TrackAsserts.assert(toolbar.buttonStates.redo === false);

    // Perform action under test. Try to redo past end of buffer.
    toolbar.simulateButtonPress("redo");
    TrackAsserts.assert(
      logger.lastWarn &&
      logger.lastWarn[0] ===
        "Trying to performCommand past end of buffer. index:" &&
      logger.lastWarn[1] === 1);

    TrackAsserts.assert(toolbar.buttonStates.undo === true);
    TrackAsserts.assert(toolbar.buttonStates.redo === false);
  },

  testUndoDeleteEvent: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    const linePosFinish: ILinePos = {
      a: {x:4, y:5, z:6},
      b: {x:44, y:55, z:66},
    };

    // Add a line.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_1",
      startPoint: linePosFinish.a,
      finishPoint: linePosFinish.b,
    }));
    const line1: ILine = {
      id: "drawnLine_1",
      finishPos: linePosFinish,
      selected: true,
    };
    model.mockGetSelectedLines = {};
    model.mockGetSelectedLines[line1.id] = line1;
    model.mockGetLineValue = line1;

    // Confirm we are on track.
    TrackAsserts.assert(model.lineEvents.length === 1);

    // Delete the line.
    toolbar.simulateButtonPress("delete");

    // Confirm we are on track.
    TrackAsserts.assert(model.lineEvents.length === 2);

    // Undo the Delete.
    toolbar.simulateButtonPress("undo");

    // Confirm we are on track.
    TrackAsserts.assert(model.lineEvents.length === 3);

    // Redo the Delete.
    model.mockGetSelectedLines = {};
    model.mockGetSelectedLines[line1.id] = line1;
    model.mockGetLineValue = line1;
    toolbar.simulateButtonPress("redo");

    TrackAsserts.assert(model.lineEvents.length === 4);
    TrackAsserts.assert(
      model.lineEvents[0].constructor.name === "EventLineNew");
    TrackAsserts.assert(
      model.lineEvents[1].constructor.name === "EventLineDelete");
    TrackAsserts.assert(
      model.lineEvents[2].constructor.name === "EventLineNew");
    TrackAsserts.assert(
      model.lineEvents[3].constructor.name === "EventLineDelete");

    TrackAsserts.assert(JSON.stringify(model.lineEvents[0]) ===
                        JSON.stringify(model.lineEvents[2]));
    TrackAsserts.assert(JSON.stringify(model.lineEvents[1]) ===
                        JSON.stringify(model.lineEvents[3]));

  },

  testUndoMirrorEvent: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new TestController(model, [widget1, widget2, toolbar], logger);

    const linePosFinish: ILinePos = {
      a: {x:4, y:5, z:6},
      b: {x:44, y:55, z:66},
    };

    // Add a line.
    widget1.simulateLineEvent(new EventUiMouseDrag({
      widgetType: widget1.widgetType,
      sequence: "sequence_1",
      startPoint: linePosFinish.a,
      finishPoint: linePosFinish.b,
    }));
    const line1: ILine = {
      id: "drawnLine_1",
      finishPos: linePosFinish,
      selected: true,
    };
    model.mockGetSelectedLines = {};
    model.mockGetSelectedLines[line1.id] = line1;
    model.mockGetLineValue = line1;

    // Confirm we are on track.
    TrackAsserts.assert(model.lineEvents.length === 1);

    // Delete the line.
    toolbar.simulateButtonPress("mirror");

    // Confirm we are on track.
    TrackAsserts.assert(model.lineEvents.length === 2);

    // Undo the Delete.
    toolbar.simulateButtonPress("undo");

    // Confirm we are on track.
    TrackAsserts.assert(model.lineEvents.length === 3);

    // Redo the Delete.
    model.mockGetSelectedLines = {};
    model.mockGetSelectedLines[line1.id] = line1;
    model.mockGetLineValue = line1;
    toolbar.simulateButtonPress("redo");

    TrackAsserts.assert(model.lineEvents.length === 4);

    TrackAsserts.assert(
      model.lineEvents[0].constructor.name === "EventLineNew");
    TrackAsserts.assert(
      model.lineEvents[1].constructor.name === "EventLineMirror");
    TrackAsserts.assert(
      model.lineEvents[2].constructor.name === "EventLineMirror");
    TrackAsserts.assert(
      model.lineEvents[3].constructor.name === "EventLineMirror");
  },
};

