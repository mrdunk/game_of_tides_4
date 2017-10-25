// Copyright 2017 duncan law (mrdunk@gmail.com)

import {LoggerMock, TrackAsserts} from "./commonFunctionstTests";
import {Controller, ILineEvent, ILinePos, IPoint} from "./controller";
import {ModelMock} from "./model";
import {ViewMock} from "./view";

export const controllerButtonEventTests = {
  testInvalidButton: () => {
    const model = null;
    const toolbar1 = new ViewMock();
    const toolbar2 = new ViewMock();
    const logger = new LoggerMock();
    const controller = new Controller(model, [toolbar1, toolbar2], logger);

    const buttonLabel = "someInvalidButton";

    // Perform action under test.
    toolbar1.simulateButtonPress(buttonLabel);

    TrackAsserts.assert(logger.lastWarn[0] === "Invalid buttonLabel:" &&
                   logger.lastWarn[1] === buttonLabel);
    TrackAsserts.assert(toolbar1.buttonValues[buttonLabel] === undefined);
    TrackAsserts.assert(toolbar2.buttonValues[buttonLabel] === undefined);
  },

  testRegularButton: () => {
    const model = null;
    const toolbar1 = new ViewMock();
    const toolbar2 = new ViewMock();
    const logger = new LoggerMock();
    const controller = new Controller(model, [toolbar1, toolbar2], logger);

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
    const controller = new Controller(model, [toolbar1, toolbar2], logger);

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
    const controller = new Controller(model, [toolbar1, toolbar2], logger);

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
      new Controller(model, [widget1, widget2, toolbar], logger);

    // Perform action under test.
    widget1.simulateLineEvent(null, null, null);

    TrackAsserts.assert(model.lineEvents.length === 0);
    TrackAsserts.assert(
      logger.lastWarn[0] === "No startPos or finishPos for line: " &&
      logger.lastWarn[1] === null);
  },

  testNewInvalidLineMissingPoint: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new Controller(model, [widget1, widget2, toolbar], logger);

    const linePos: ILinePos = {
      a: {x:1, y:2, z:3},
      b: null,
    };

    // Perform action under test.
    widget1.simulateLineEvent(null, linePos, null);

    TrackAsserts.assert(model.lineEvents.length === 0);
    TrackAsserts.assert(
      logger.lastWarn[0] === "Missing endpoint for startPos of line: " &&
      logger.lastWarn[1] === null);

    // Perform action under test again.
    widget1.simulateLineEvent(null, null, linePos);

    TrackAsserts.assert(model.lineEvents.length === 0);
    TrackAsserts.assert(
      logger.lastWarn[0] === "Missing endpoint for endPos of line: " &&
      logger.lastWarn[1] === null);
  },
  
  testNewInvalidLineNoIdOnMove: () => {
    const model = new ModelMock();
    const widget1 = new ViewMock();
    const widget2 = new ViewMock();
    const toolbar = new ViewMock();
    const logger = new LoggerMock();
    const controller =
      new Controller(model, [widget1, widget2, toolbar], logger);

    const linePosStart: ILinePos = {
      a: {x:1, y:2, z:3},
      b: {x:11, y:22, z:33},
    };

    const linePosFinish: ILinePos = {
      a: {x:4, y:5, z:6},
      b: {x:44, y:55, z:66},
    };

    // Perform action under test.
    widget1.simulateLineEvent(null, linePosStart, linePosFinish);

    TrackAsserts.assert(model.lineEvents.length === 0);
    TrackAsserts.assert(logger.lastWarn[0] ===
      "No id specified for line being moved or deleted.");
  },

};

