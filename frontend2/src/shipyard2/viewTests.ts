// Copyright 2017 duncan law (mrdunk@gmail.com)

import {LoggerMock, TrackAsserts} from "./commonFunctionstTests";
import {MockController} from "./controller";
import {MockViewCrossSection, ViewCanvas} from "./view";

export const viewOnMouseDown = {
  noClickNoLineUnderTest: () => {
    const canvas = document.createElement("canvas");
    canvas.id = "canvas";
    document.body.appendChild(canvas);
    const offsetX = 10;
    const offsetY = 10;
    const konvaCanvas = new ViewCanvas();

    const view = new MockViewCrossSection(konvaCanvas, offsetX, offsetY);

    // Confirm sane start conditions.
    console.assert(view.mouseDown === false);
    console.assert(view.mouseHighlight === "");
    console.assert(!view.mouseDragging);
    console.assert(!view.mouseDraggingStartPos);
    console.assert(!view.mouseDrawingStartPos);

    // Simulate mouse event.
    const mouseEvent = new MouseEvent("mousemove", {
      view: window,
      bubbles: true,
      buttons: 0,
    });

    const target = view.layer;

    const event = {
      evt: mouseEvent,
      target,
    };

    view.onMouseMove(event);

    // No clicks and no interesting mouseOver === No change
    console.assert(view.mouseDown === false);
    console.assert(view.mouseHighlight === "");
    console.assert(!view.mouseDragging);
    console.assert(!view.mouseDraggingStartPos);
    console.assert(!view.mouseDrawingStartPos);
  },

  clickNoLineUnderTest: () => {
    const canvas = document.createElement("canvas");
    canvas.id = "canvas";
    document.body.appendChild(canvas);
    const offsetX = 10;
    const offsetY = 10;
    const konvaCanvas = new ViewCanvas();

    const view = new MockViewCrossSection(konvaCanvas, offsetX, offsetY);
    const controller = new MockController(null, [view]);

    // Confirm sane start conditions.
    console.assert(view.mouseDown === false);
    console.assert(view.mouseHighlight === "");
    console.assert(!view.mouseDragging);
    console.assert(!view.mouseDraggingStartPos);
    console.assert(!view.mouseDrawingStartPos);

    // Simulate mouse event.
    const mouseEvent = new MouseEvent("mousemove", {
      view: window,
      bubbles: true,
      buttons: 1,
    });

    const target = view.layer;

    const event = {
      evt: mouseEvent,
      target,
    };

    view.onMouseMove(event);

    // No clicks and no interesting mouseOver === No change
    console.assert(view.mouseDown === false);
    console.assert(view.mouseHighlight === "");
    console.assert(!view.mouseDragging);
    console.assert(!view.mouseDraggingStartPos);
    console.assert(!view.mouseDrawingStartPos);
  },
};

