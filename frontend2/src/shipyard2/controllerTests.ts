// Copyright 2017 duncan law (mrdunk@gmail.com)

import {Controller} from "./controller";
import {ViewMock} from "./view";

class LoggerMock {
  public lastLog;
  public lastWarn;

  public log(...output) {
    console.log(this.concatVariables(output));
    this.lastLog = output;
  }

  public warn(...output) {
    console.warn(this.concatVariables(output));
    this.lastWarn = output;
  }

  private concatVariables(input): string {
    let output = "";
    input.forEach((peramiter) => {
      output += String(peramiter) + " ";
    });
    return output;
  }
}

class TrackAsserts {
  public static value: boolean = true;

  public static assert(value: boolean) {
    this.value = this.value && value;
    console.assert(value);
  }
}

const testButtons = [
  function testInvalidButton() {
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

  function testRegularButton() {
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

  function testSingleToggleButton() {
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

  function testPairedToggleButtons() {
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
];

window.onload = () => {
  console.log("controllerTests.ts");
  const outputPannel = document.getElementById("testOutput");
  outputPannel.innerHTML = "";

  testButtons.forEach((test) => {
    TrackAsserts.value = true;
    const container = document.createElement("div");
    outputPannel.appendChild(container);
    test();
    if(TrackAsserts.value) {
      container.classList.add("test-pass");
    } else {
      container.classList.add("test-fail");
    }
    container.innerHTML = "testButtons." + test.name;
  });
};
