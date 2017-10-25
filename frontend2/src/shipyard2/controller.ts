// Copyright 2017 duncan law (mrdunk@gmail.com)

import {ModelBase} from "./model";
import {ViewBase} from "./view";

interface ICommand {
  lineEvents: ILineEvent[];
}

export interface IPoint {
  x: number;  // Port/Starbord axis.
  y: number;  // Up/Down axis.
  z: number;  // Fore/Aft axis.
}

export interface ILinePos {
  a: IPoint;
  b: IPoint;
}

export interface ILineEvent {
  id: string;
  startPos: ILinePos;
  finishPos: ILinePos;
}

export class Controller {
  private idGenerator: number = 0;
  private commands: ICommand[];
  private commandPointer: number;
  private views: ViewBase[];
  private model: ModelBase;
  private logger;
  private buttonStates = {
    addLine: {state: false, clear: ["delete", "mirror"]},
    delete: {state: false, clear: ["addLine", "mirror"]},
    mirror: {state: false, clear: ["addLine", "delete"]},
    allLayers: {state: false, clear: []},
  };

  constructor(model: ModelBase, views: ViewBase[], logger?) {
    this.model = model;  // TODO Can this be assigned automatically?
    this.views = views;
    this.logger = logger || console;
    this.commands = [];
    this.commandPointer = 0;

    if(model) {
      model.init(this);
    }

    views.forEach((view) => {
      view.init(this);
    });

    this.views.forEach((view) => {
      view.setButtonState("undo", false);
      view.setButtonState("redo", this.commandPointer < this.commands.length);
    });
  }

  public onButtonEvent(buttonLabel: string) {
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
  }

  public onLineEvent(lineEvent: ILineEvent) {
    if(!lineEvent.startPos && !lineEvent.finishPos) {
      this.logger.warn("No startPos or finishPos for line: ", lineEvent.id);
      return;
    }

    if(lineEvent.startPos &&
       (!lineEvent.startPos.a || !lineEvent.startPos.b)) {
      this.logger.warn(
        "Missing endpoint for startPos of line: ", lineEvent.id);
      return;
    }
    if(lineEvent.finishPos &&
       (!lineEvent.finishPos.a || !lineEvent.finishPos.b)) {
      this.logger.warn(
        "Missing endpoint for endPos of line: ", lineEvent.id);
      return;
    }

    if(!lineEvent.id) {
      if(lineEvent.startPos) {
        this.logger.warn(
          "No id specified for line being moved or deleted.");
        return;
      }
      // No id and no lineEvent.startPos implies this is a new line.
      lineEvent.id = "line_" + this.idGenerator;
      this.idGenerator++;
    }

    const command: ICommand = {
      lineEvents: [lineEvent],
    };
    this.recordCommand(command);
    this.model.onLineEvent(lineEvent);
  }

  public updateButton(buttonLabel: string) {
    if(this.buttonStates[buttonLabel] === undefined) {
      // Just a simple non-toggling push button.
      return;
    }

    this.buttonStates[buttonLabel].value =
      !this.buttonStates[buttonLabel].value;
    const value = this.buttonStates[buttonLabel].value;
    this.views.forEach((view) => {
      view.setButtonValue(buttonLabel, value);
      this.buttonStates[buttonLabel].clear.forEach((otherButtonLabel) => {
        this.buttonStates[otherButtonLabel].value = false;
        view.setButtonValue(otherButtonLabel, false);
      });
    });
  }

  private recordCommand(command: ICommand) {
    this.commands.push(command);

    this.views.forEach((view) => {
      view.setButtonState("undo", true);
      view.setButtonState("redo", this.commandPointer < this.commands.length);
    });
  }
}
