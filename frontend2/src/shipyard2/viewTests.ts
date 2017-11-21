// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import {LoggerMock, TrackAsserts} from "./commonFunctionstTests";
import {comparePoint, MockController} from "./controller";
import {Line, MockViewCrossSection, ViewCanvas} from "./view";

export const viewOnMouseDown = {
  testNoClickNoLineUnderMouse: () => {
    const canvas = document.createElement("canvas");
    canvas.id = "canvas";
    document.body.appendChild(canvas);
    const offsetX = 10;
    const offsetY = 10;
    const konvaCanvas = new ViewCanvas();

    const view = new MockViewCrossSection(konvaCanvas, offsetX, offsetY);

    // Confirm sane start conditions.
    TrackAsserts.assert(view.mouseDown === false);
    TrackAsserts.assert(view.mouseHighlight === "");
    TrackAsserts.assert(!view.mouseDragging);
    TrackAsserts.assert(!view.mouseDraggingStartPos);
    TrackAsserts.assert(!view.mouseDrawingStartPos);

    // Simulate mouse event.
    const mouseEvent = new MouseEvent("mousemove", {
      view: window,
      bubbles: true,
      buttons: 0,
    });

    const target = view.background;

    const event = {
      evt: mouseEvent,
      target,
    };

    view.onMouseMove(event);

    // No clicks and no interesting mouseOver === No change
    TrackAsserts.assert(view.mouseDown === false);
    TrackAsserts.assert(view.mouseHighlight === "");
    TrackAsserts.assert(!view.mouseDragging);
    TrackAsserts.assert(!view.mouseDraggingStartPos);
    TrackAsserts.assert(!view.mouseDrawingStartPos);
  },

  testDrawLine: () => {
    const canvas = document.createElement("canvas");
    canvas.id = "canvas";
    document.body.appendChild(canvas);
    const offsetX = 10;
    const offsetY = 10;
    const konvaCanvas = new ViewCanvas();

    const view = new MockViewCrossSection(konvaCanvas, offsetX, offsetY);
    const controller = new MockController(null, [view]);

    // Confirm sane start conditions.
    TrackAsserts.assert(view.mouseDown === false);
    TrackAsserts.assert(view.mouseHighlight === "");
    TrackAsserts.assert(!view.mouseDragging);
    TrackAsserts.assert(!view.mouseDraggingStartPos);
    TrackAsserts.assert(!view.mouseDrawingStartPos);

    // Simulate mouse-down event.
    const mouseEvent = new MouseEvent("mousemove", {
      view: window,
      bubbles: true,
      buttons: 1,
    });

    const target = view.background;
    const event = {
      evt: mouseEvent,
      target,
    };

    view.onMouseMove(event);

    // Mouse down and no interesting mouseOver implies line-draw.
    TrackAsserts.assert(view.mouseDown === true);
    TrackAsserts.assert(view.mouseHighlight === "");
    TrackAsserts.assert(!view.mouseDragging);
    TrackAsserts.assert(!view.mouseDraggingStartPos);
    TrackAsserts.assert(Boolean(view.mouseDrawingStartPos));
    TrackAsserts.assert(
      view.mouseDrawingStartPos.x === -offsetX - (target.width() / 2));
    TrackAsserts.assert(
      view.mouseDrawingStartPos.y === offsetY + (target.height() / 2));
    TrackAsserts.assert(controller.commands.length === 1);
    // Unset startPos implies this is a new line rather than dragging existing.
    TrackAsserts.assert(!controller.commands[0].startPos);
    TrackAsserts.assert(comparePoint(controller.commands[0].finishPos.a,
                                view.mouseDrawingStartPos));
    TrackAsserts.assert(comparePoint(controller.commands[0].finishPos.a,
                                controller.commands[0].finishPos.b));

    // Move mouse to centre of view (0,0,0).
    view.mockScreenMousePosX = offsetX + (target.width() / 2);
    view.mockScreenMousePosY = offsetY + (target.height() / 2);

    view.onMouseMove(event);

    // Mouse still down and no interesting mouseOver: line-draw happening.
    TrackAsserts.assert(view.mouseDown === true);
    TrackAsserts.assert(view.mouseHighlight === "");
    TrackAsserts.assert(!view.mouseDragging);
    TrackAsserts.assert(!view.mouseDraggingStartPos);
    TrackAsserts.assert(Boolean(view.mouseDrawingStartPos));
    TrackAsserts.assert(
      view.mouseDrawingStartPos.x === -offsetX - (target.width() / 2));
    TrackAsserts.assert(
      view.mouseDrawingStartPos.y === offsetY + (target.height() / 2));
    TrackAsserts.assert(controller.commands.length === 2);
    // Unset startPos implies this is a new line rather than dragging existing.
    TrackAsserts.assert(!controller.commands[1].startPos);
    // Line between view.mouseDrawingStartPos and centre of view (0,0,0).
    TrackAsserts.assert(comparePoint(controller.commands[1].finishPos.a,
                                view.mouseDrawingStartPos));
    TrackAsserts.assert(comparePoint({x: 0, y:0, z: 0},
                                controller.commands[1].finishPos.b));
  },

  testDragExistingLine: () => {
    const canvas = document.createElement("canvas");
    canvas.id = "canvas";
    document.body.appendChild(canvas);
    const offsetX = 10;
    const offsetY = 10;
    const konvaCanvas = new ViewCanvas();

    const view = new MockViewCrossSection(konvaCanvas, offsetX, offsetY);
    const controller = new MockController(null, [view]);

    // Confirm sane start conditions.
    TrackAsserts.assert(view.mouseDown === false);
    TrackAsserts.assert(view.mouseHighlight === "");
    TrackAsserts.assert(!view.mouseDragging);
    TrackAsserts.assert(!view.mouseDraggingStartPos);
    TrackAsserts.assert(!view.mouseDrawingStartPos);

    // Simulate mouse event.
    const mouseEvent = new MouseEvent("mousemove", {
      view: window,
      bubbles: true,
      buttons: 1,
    });

    const line = new Line("testLine", view.onMouseMove.bind(view));
    const target = line.endA;

    const event = {
      evt: mouseEvent,
      target,
    };

    view.onMouseMove(event);

    const background = view.background;

    // Line end has been dragged to mouse position.
    TrackAsserts.assert(view.mouseDown === true);
    TrackAsserts.assert(view.mouseHighlight === "");
    TrackAsserts.assert(Boolean(view.mouseDragging));
    TrackAsserts.assert(comparePoint(view.mouseDraggingStartPos.a,
                                     {x: -(background.width() / 2) + offsetX,
                                      y: (background.height() / 2) - offsetY,
                                      z: 0}));
    TrackAsserts.assert(!view.mouseDrawingStartPos);
    console.log(view);
  },

  testLineHighlight: () => {
    const canvas = document.createElement("canvas");
    canvas.id = "canvas";
    document.body.appendChild(canvas);
    const offsetX = 10;
    const offsetY = 10;
    const konvaCanvas = new ViewCanvas();

    const view = new MockViewCrossSection(konvaCanvas, offsetX, offsetY);
    const controller = new MockController(null, [view]);

    // Confirm sane start conditions.
    TrackAsserts.assert(view.mouseDown === false);
    TrackAsserts.assert(view.mouseHighlight === "");
    TrackAsserts.assert(!view.mouseDragging);
    TrackAsserts.assert(!view.mouseDraggingStartPos);
    TrackAsserts.assert(!view.mouseDrawingStartPos);

    // Simulate mouse event.
    const mouseEvent = new MouseEvent("mousemove", {
      view: window,
      bubbles: true,
      buttons: 0,
    });

    const line = new Line("testLine", view.onMouseMove.bind(view));
    const target: Konva.Node = line.endA;

    const event = {
      evt: mouseEvent,
      target,
    };

    view.onMouseMove(event);

    // No clicks and mouseOver line === highlight line.
    TrackAsserts.assert(view.mouseDown === false);
    TrackAsserts.assert(view.mouseHighlight === line.id());
    TrackAsserts.assert(!view.mouseDragging);
    TrackAsserts.assert(!view.mouseDraggingStartPos);
    TrackAsserts.assert(!view.mouseDrawingStartPos);
    TrackAsserts.assert(controller.commands.length === 1);
    TrackAsserts.assert(controller.commands[0].highlight);

    event.target = view.background;
    view.onMouseMove(event);

    // No clicks and not mouseOver line === not highlight line.
    TrackAsserts.assert(view.mouseDown === false);
    TrackAsserts.assert(view.mouseHighlight === "");
    TrackAsserts.assert(!view.mouseDragging);
    TrackAsserts.assert(!view.mouseDraggingStartPos);
    TrackAsserts.assert(!view.mouseDrawingStartPos);
    TrackAsserts.assert(controller.commands.length === 2);
    TrackAsserts.assert(!controller.commands[1].highlight);
  },

};

