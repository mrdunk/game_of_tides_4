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

export interface ILine {
  id: string;
  finishPos?: ILinePos;
  highlight?: boolean;
}

export interface ILineEvent extends ILine {
  sequence: string;
  startPos?: ILinePos;
}

export function comparePoint(p1: IPoint, p2: IPoint): boolean {
  return (p1.x === p2.x && p1.y === p2.y && p1.z === p2.z);
}

export function compareLinePos(lp1: ILinePos, lp2: ILinePos): boolean {
  if(lp1 === null || lp2 === null) {
    return (lp1 === lp2);
  }
  return (comparePoint(lp1.a, lp2.a) && comparePoint(lp1.b, lp2.b));
}

export function compareLineEvent(e1: ILineEvent, e2: ILineEvent): boolean {
  return (
    e1.id === e2.id &&
    compareLinePos(e1.startPos, e2.startPos) &&
    compareLinePos(e1.finishPos, e2.finishPos)
  );
}

export class Controller {
  protected commands: ICommand[];
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

    this.setButtonStates();
  }

  public onButtonEvent(buttonLabel: string) {
    this.logger.log(buttonLabel);

    switch (buttonLabel) {
      case "undo":
        this.undoCommand();
        break;
      case "redo":
        this.performCommand();
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
    if(!lineEvent.id && !lineEvent.startPos && !lineEvent.finishPos) {
      this.logger.warn("No id, startPos or finishPos for line: ", lineEvent.id);
      return;
    }

    if(lineEvent.id && !lineEvent.startPos && !lineEvent.finishPos &&
         lineEvent.highlight === undefined) {
      this.logger.warn("No startPos, finishPos or options for line: ",
                       lineEvent.id);
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
    }

    const command: ICommand = {
      lineEvents: [lineEvent],
    };
    this.recordCommand(command);
    this.performCommand();
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

  public updateViews(line: ILine) {
    this.views.forEach((view) => {
      view.updateLine(line);
    });
  }

  private commandsMatchingSequence(command1: ICommand,
                                   command2: ICommand): boolean {
    if(command1 === undefined || command2 === undefined) {
      return false;
    }
    let returnVal = false;
    command1.lineEvents.forEach((lineEvent1) => {
      command2.lineEvents.forEach((lineEvent2) => {
        if(lineEvent1.sequence === lineEvent2.sequence) {
          returnVal = true;
        }
      });
    });
    return returnVal;
  }

  // Set whether the "back" and "forward" buttons are selectable.
  private setButtonStates() {
    this.views.forEach((view) => {
      view.setButtonState("undo", this.commandPointer > 0);
      view.setButtonState("redo", this.commandPointer < this.commands.length);
    });
  }

  private recordCommand(command: ICommand) {
    if(this.commandsMatchingSequence(
          this.commands[this.commandPointer -1], command)) {
      this.commandPointer--;
    }
    this.commands = this.commands.slice(0, this.commandPointer);
    this.commands.push(command);
  }

  private performCommand(commandIndex?: number) {
    if(commandIndex === undefined) {
      commandIndex = this.commandPointer;
    }
    if(commandIndex >= this.commands.length || commandIndex < 0) {
      this.logger.warn("Trying to performCommand past end of buffer. index:",
                       commandIndex);
      return;
    }
    const command = this.commands[commandIndex];
    command.lineEvents.forEach((lineEvent) => {
      this.model.onLineEvent(lineEvent);
    });

    this.commandPointer++;
    this.setButtonStates();
  }

  private undoCommand(commandIndex?: number) {
    this.commandPointer--;
    if(commandIndex === undefined) {
      commandIndex = this.commandPointer;
    }
    if(commandIndex >= this.commands.length || commandIndex < 0) {
      this.logger.warn("Trying to performCommand past end of buffer. index:",
                       commandIndex);
      this.commandPointer = 0;
      return;
    }
    const command = this.commands[commandIndex];
    command.lineEvents.forEach((lineEvent) => {
      const reverseLineEvent = {
        id: lineEvent.id,
        startPos: JSON.parse(JSON.stringify(lineEvent.finishPos)),
        finishPos: JSON.parse(JSON.stringify(lineEvent.startPos)),
      };
      this.model.onLineEvent(reverseLineEvent);
    });
    this.setButtonStates();
  }
}

export class ControllerMock extends Controller {
  public commands: ICommand[];
}
