// Copyright 2017 duncan law (mrdunk@gmail.com)

import {TrackAsserts} from "./commonFunctionstTests";
import {
  controllerButtonEventTests,
  controllerCommandHistoryTests,
  controllerLineEventTests,
} from "./controllerTests";


window.onload = () => {
  console.log("mainTests.ts");
  const outputPannel = document.getElementById("testOutput");
  outputPannel.innerHTML = "";

  const testSuites = {
    controllerButtonEventTests,
    controllerLineEventTests,
    controllerCommandHistoryTests,
  };

  for(const testSuiteName in testSuites) {
    if(!testSuites.hasOwnProperty(testSuiteName)) {
      continue;
    }
    const testSuite = testSuites[testSuiteName];

    for(const testName in testSuite) {
      if(!testSuite.hasOwnProperty(testName)) {
        continue;
      }
      const test = testSuite[testName];

      TrackAsserts.value = true;
      const container = document.createElement("div");
      outputPannel.appendChild(container);
      test();
      if(TrackAsserts.value) {
        container.classList.add("test-pass");
      } else {
        container.classList.add("test-fail");
      }
      container.innerHTML = testSuiteName + "." + test.name;
    }
  }
};
