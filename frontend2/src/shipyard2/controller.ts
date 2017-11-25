// Copyright 2017 duncan law (mrdunk@gmail.com)

import {ModelBase} from "./model";
import {ViewBase} from "./view";

interface ICommand {
  lineEvents: ILineEvent[];
}

export interface IPoint {
  x: number;  // Port/Starboard axis.
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
  mirrored?: boolean;
}

export interface ILineEvent extends ILine {
  sequence: string;
  startPos?: ILinePos;
  toggleMirrored?: boolean;
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

export abstract class ControllerBase {
  protected commands: ICommand[];
  protected views: ViewBase[];
  protected model: ModelBase;
  protected logger;
  constructor(model: ModelBase, views: ViewBase[], logger?) {
    this.model = model;  // TODO Can this be assigned automatically?
    this.views = views;
    this.logger = logger || console;

    if(this.model) {
      this.model.init(this);
    }

    this.views.forEach((view) => {
      view.init(this);
    });
  }

  public onLineEvent(event): void {/**/}
  public updateViews(line: ILine): void {/**/}
  public onButtonEvent(buttonLabel: string) {/**/}
  public getLine(lineId: string): ILine {
    return this.model.getLine(lineId);
  }
}

export class Controller extends ControllerBase {
  protected commands: ICommand[];
  protected views: ViewBase[];
  protected model: ModelBase;
  protected logger;
  private commandPointer: number;
  private buttonStates = {
    addLine: {value: true, clear: ["delete", "mirror"], preventUnClick: true},
    delete: {value: false, clear: ["addLine", "mirror"], preventUnClick: true},
    mirror: {value: false, clear: ["addLine", "delete"], preventUnClick: true},
    allLayers: {value: false, clear: []},
  };

  constructor(model: ModelBase, views: ViewBase[], logger?) {
    super(model, views, logger);
    this.commands = [];
    this.commandPointer = 0;

    this.setButtonStates();
  }

  public onButtonEvent(buttonLabel: string) {
    this.logger.log(buttonLabel);

    switch (buttonLabel) {
      case "undo":
        this.undoCommand();
        break;
      case "redo":
        this.redoCommand();
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
      if(!lineEvent.sequence.startsWith("sequence_")) {
        // TODO UnitTest for this case.
        this.logger.warn("No id or sequence specified.");
        return;
      }
      lineEvent.id = "drawnLine_" + lineEvent.sequence.slice(9);
    }

    if(this.buttonStates.delete.value) {
      lineEvent.finishPos = null;
    } else if(this.buttonStates.mirror.value && lineEvent.finishPos) {
      lineEvent.toggleMirrored = true;
      lineEvent.startPos = null;
      lineEvent.finishPos = null;
    }

    const command: ICommand = {
      lineEvents: [lineEvent],
    };
    this.recordCommand(command);
    this.performCommand(null, command);
  }

  public updateButton(buttonLabel: string) {
    if(this.buttonStates[buttonLabel] === undefined) {
      // Just a simple non-toggling push button.
      return;
    }

    if(this.buttonStates[buttonLabel].preventUnClick &&
        this.buttonStates[buttonLabel].value) {
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

  private setButtonStates() {
    this.views.forEach((view) => {
      // Set whether the "back" and "forward" buttons are selectable.
      view.setButtonState("undo", this.commandPointer > 0);
      view.setButtonState("redo", this.commandPointer < this.commands.length);

      for(const key in this.buttonStates) {
        if (this.buttonStates.hasOwnProperty(key)) {
          view.setButtonValue(key, this.buttonStates[key].value);
        }
      }
    });
  }

  private commandsMatchingSequence(
      command1: ICommand, command2: ICommand): boolean {
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

  private loggableCommand(command: ICommand): boolean {
    let returnVal = false;
    command.lineEvents.forEach((lineEvent) => {
      returnVal = returnVal ||
                  Boolean(lineEvent.startPos) ||
                  Boolean(lineEvent.finishPos);
    });
    return returnVal;
  }

  private recordCommand(command: ICommand) {
    if(!this.loggableCommand(command)) {
      return;
    }

    if(!this.commandsMatchingSequence(
        this.commands[this.commandPointer -1], command)) {
      this.commandPointer++;
    }

    this.commands = this.commands.slice(0, this.commandPointer -1);
    this.commands.push(command);
  }

  private performCommand(commandIndex?: number, command?: ICommand) {
    if(commandIndex === undefined) {
      commandIndex = this.commandPointer;
    }

    if(command === undefined) {
      command = this.commands[commandIndex];
    }

    command.lineEvents.forEach((lineEvent) => {
      this.model.onLineEvent(lineEvent);
    });

    this.setButtonStates();
  }

  private undoCommand(commandIndex?: number) {
    this.commandPointer--;

    if(commandIndex === undefined) {
      commandIndex = this.commandPointer;
    }

    if(commandIndex >= this.commands.length || commandIndex < 0) {
      this.logger.warn("Trying to undoCommand past end of buffer. index:",
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

  private redoCommand(commandIndex?: number) {
    if(commandIndex === undefined) {
      commandIndex = this.commandPointer;
    }
    if(commandIndex >= this.commands.length || commandIndex < 0) {
      this.logger.warn("Trying to performCommand past end of buffer. index:",
        commandIndex);
      return;
    }
    this.performCommand();
    this.commandPointer++;
    this.setButtonStates();
  }
}

// Controller with relaxed permissions for testing.
export class TestController extends Controller {
  public commands: ICommand[];
}

export class MockController extends ControllerBase {
  public commands;
  public getLineReturnValue: ILine;

  constructor(model: ModelBase, views: ViewBase[], logger?) {
    super(model, views, logger);
    this.commands = [];
  }

  public onLineEvent(event): void {
    this.commands.push(event);
  }

  public getLine(lineId: string): ILine {
    return this.getLineReturnValue;
  }
}
