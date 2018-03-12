// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import {LoggerMock, TrackAsserts} from "./commonFunctionstTests";
import {comparePoint, MockController} from "./controller";
import {
  EventBase,
  EventUiInputElement,
  EventUiMouseDrag,
  EventUiMouseMove,
  EventUiSelectRib,
  LineEnd } from "./events";
import {Line, MockViewCrossSection, ViewCanvas} from "./view";

export const viewMouseEventTests = {
  testNoClickNoLineUnderMouse: () => {
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
    TrackAsserts.assert(!view.mouseDragStartPos);
    TrackAsserts.assert(!view.mouseDragStartLineId);
    TrackAsserts.assert(!view.mouseDragStartEndId);

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
    TrackAsserts.assert(!view.mouseDragStartPos);
    TrackAsserts.assert(!view.mouseDragStartLineId);
    TrackAsserts.assert(!view.mouseDragStartEndId);

    TrackAsserts.assert(controller.commands.length === 1);
    TrackAsserts.assert(controller.commands[0] instanceof EventUiMouseMove);
    TrackAsserts.assert(Boolean(controller.commands[0].startPoint));
    TrackAsserts.assert(controller.commands[0].lineId === undefined);
    TrackAsserts.assert(controller.commands[0].lineEnd === undefined);
  },

  testMouseDrag: () => {
    const canvas = document.createElement("canvas");
    canvas.id = "canvas";
    document.body.appendChild(canvas);
    const offsetX = 10;
    const offsetY = 10;
    const konvaCanvas = new ViewCanvas();

    const view = new MockViewCrossSection(konvaCanvas, offsetX, offsetY);
    view.z = 0;
    const controller = new MockController(null, [view]);

    // Confirm sane start conditions.
    TrackAsserts.assert(view.mouseDown === false);
    TrackAsserts.assert(!view.mouseDragStartPos);
    TrackAsserts.assert(!view.mouseDragStartLineId);
    TrackAsserts.assert(!view.mouseDragStartEndId);

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
    const startPos = {
      x: -offsetX - (target.width() / 2),
      y: offsetY + (target.height() / 2),
      z: 0};

    view.onMouseMove(event);

    // Mouse down and no interesting mouseOver.
    TrackAsserts.assert(view.mouseDown === true);
    TrackAsserts.assert(Boolean(view.mouseDragStartPos));
    TrackAsserts.assert(!view.mouseDragStartLineId);
    TrackAsserts.assert(!view.mouseDragStartEndId);
    TrackAsserts.assert(controller.commands.length === 1);
    TrackAsserts.assert(controller.commands[0] instanceof EventUiMouseDrag);
    TrackAsserts.assert(comparePoint(controller.commands[0].startPoint,
                                     startPos));
    TrackAsserts.assert(comparePoint(controller.commands[0].finishPoint,
                                     startPos));
    TrackAsserts.assert(controller.commands[0].lineId === undefined);
    TrackAsserts.assert(controller.commands[0].lineEnd === undefined);

    // Move mouse to centre of view (0,0,0).
    view.mockScreenMousePosX = offsetX + (target.width() / 2);
    view.mockScreenMousePosY = offsetY + (target.height() / 2);

    view.onMouseMove(event);

    // Mouse still down and no interesting mouseOver: mouse-drag happening.
    TrackAsserts.assert(view.mouseDown === true);
    TrackAsserts.assert(Boolean(view.mouseDragStartPos));
    TrackAsserts.assert(!view.mouseDragStartLineId);
    TrackAsserts.assert(!view.mouseDragStartEndId);
    TrackAsserts.assert(controller.commands.length === 2);
    TrackAsserts.assert(controller.commands[1] instanceof EventUiMouseDrag);

    // Line between startPos and centre of view (0,0,0).
    TrackAsserts.assert(comparePoint(controller.commands[1].startPoint,
                                     startPos));
    TrackAsserts.assert(comparePoint(controller.commands[1].finishPoint,
                                     {x: 0, y:0, z: 0}));

    TrackAsserts.assert(
      controller.commands[0].sequence === controller.commands[1].sequence);
    TrackAsserts.assert(controller.commands[0].lineId === undefined);
    TrackAsserts.assert(controller.commands[0].lineEnd === undefined);
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
    TrackAsserts.assert(!view.mouseDragStartPos);
    TrackAsserts.assert(!view.mouseDragStartLineId);
    TrackAsserts.assert(!view.mouseDragStartEndId);

    // Simulate mouse event.
    const mouseEvent = new MouseEvent("mousemove", {
      view: window,
      bubbles: true,
      buttons: 1,
    });

    const line = new Line("testLine", view.onMouseMove.bind(view));
    const target = line.end1A;

    const event = {
      evt: mouseEvent,
      target,
    };

    const mockLineEndA = {x:1, y:2, z:3};
    const mockLineEndB = {x:4, y:5, z:6};

    view.controller.getLineReturnValue = {
      id: "testLine",
      finishPos: {a: mockLineEndA, b: mockLineEndB},
    };

    view.onMouseMove(event);

    const background = view.background;

    // Line end has been dragged to mouse position.
    TrackAsserts.assert(view.mouseDown === true);
    TrackAsserts.assert(Boolean(view.mouseDragStartPos));
    TrackAsserts.assert(view.mouseDragStartLineId === "testLine");
    TrackAsserts.assert(view.mouseDragStartEndId === LineEnd.A1);

    TrackAsserts.assert(controller.commands.length === 1);
    TrackAsserts.assert(controller.commands[0] instanceof EventUiMouseDrag);
    TrackAsserts.assert(controller.commands[0].lineId === "testLine");
    TrackAsserts.assert(controller.commands[0].lineEnd === LineEnd.A1);
    TrackAsserts.assert(Boolean(controller.commands[0].startPoint));
    TrackAsserts.assert(Boolean(controller.commands[0].finishPoint));
  },

  testMouseMove: () => {
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
    TrackAsserts.assert(!view.mouseDragStartPos);
    TrackAsserts.assert(!view.mouseDragStartLineId);
    TrackAsserts.assert(!view.mouseDragStartEndId);

    // Simulate mouse event.
    const mouseEvent = new MouseEvent("mousemove", {
      view: window,
      bubbles: true,
      buttons: 0,
    });

    const line = new Line("testLine", view.onMouseMove.bind(view));
    const target: Konva.Node = line.end1A;

    const event = {
      evt: mouseEvent,
      target,
    };

    view.onMouseMove(event);

    // No clicks and mouseOver line === highlight line.
    TrackAsserts.assert(view.mouseDown === false);
    TrackAsserts.assert(!view.mouseDragStartPos);
    TrackAsserts.assert(!view.mouseDragStartLineId);
    TrackAsserts.assert(!view.mouseDragStartEndId);

    TrackAsserts.assert(controller.commands.length === 1);
    TrackAsserts.assert(controller.commands[0] instanceof EventUiMouseMove);
    TrackAsserts.assert(Boolean(controller.commands[0].startPoint));
    TrackAsserts.assert(controller.commands[0].lineId === "testLine");
    TrackAsserts.assert(controller.commands[0].lineEnd === LineEnd.A1);

    event.target = view.background;
    view.onMouseMove(event);

    // No clicks and not mouseOver line === not highlight line.
    TrackAsserts.assert(view.mouseDown === false);
    // TrackAsserts.assert(!view.mouseDragObj);
    // TrackAsserts.assert(!view.mouseDragObjStartPos);
    // TrackAsserts.assert(!view.mouseDrawingStartPos);
    TrackAsserts.assert(controller.commands.length === 2);
    TrackAsserts.assert(controller.commands[1] instanceof EventUiMouseMove);
    TrackAsserts.assert(Boolean(controller.commands[1].startPoint));
    TrackAsserts.assert(controller.commands[1].lineId === undefined);
    TrackAsserts.assert(controller.commands[1].endId === undefined);
  },
};

