// Copyright 2017 duncan law (mrdunk@gmail.com)

import {TrackAsserts} from "./commonFunctionstTests";
import {
  controllerButtonEventTests,
  controllerCommandHistoryTests,
  controllerLineEventTests,
} from "./controllerTests";
import {
  viewOnMouseDown,
} from "./viewTests";


window.onload = () => {
  console.log("mainTests.ts");
  const outputPannel = document.getElementById("testOutput");
  outputPannel.innerHTML = "";

  const testSuites = {
    controllerButtonEventTests,
    controllerLineEventTests,
    controllerCommandHistoryTests,
    viewOnMouseDown,
  };

  for(const testSuiteName in testSuites) {
    if(!testSuites.hasOwnProperty(testSuiteName)) {
      continue;
    }

    let container = document.createElement("div");
    container.innerHTML = testSuiteName;
    container.classList.add("test-header");
    outputPannel.appendChild(container);

    const testSuite = testSuites[testSuiteName];

    for(const testName in testSuite) {
      if(!testSuite.hasOwnProperty(testName)) {
        continue;
      }
      const test = testSuite[testName];
      console.log("---", test.name, "---");

      TrackAsserts.value = true;
      container = document.createElement("div");
      outputPannel.appendChild(container);
      test();
      if(TrackAsserts.value) {
        container.classList.add("test-pass");
      } else {
        container.classList.add("test-fail");
      }
      container.innerHTML = "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp." + test.name;
    }
  }
};
