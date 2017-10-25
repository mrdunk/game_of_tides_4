// Copyright 2017 duncan law (mrdunk@gmail.com)

import {Model} from "./model";
import {ViewBase} from "./view";

interface ICommand {
  name: string;
}

export class Controller {
  private commands: ICommand[];
  private commandPointer: number;
  private views: ViewBase[];
  private model: Model;
  private logger;
  private buttonStates = {
    addLine: {state: false, clear: ["delete", "mirror"]},
    delete: {state: false, clear: ["addLine", "mirror"]},
    mirror: {state: false, clear: ["addLine", "delete"]},
    allLayers: {state: false, clear: []},
  };

  constructor(model: Model, views: ViewBase[], logger?) {
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
