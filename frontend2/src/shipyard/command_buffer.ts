// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import { MovableLine} from "./primatives";

const coalesceTime = 10000;  // ms.

export interface ICommand {
  action: string;
  name: string;
  rib: number;
  time: number;
  xa?: number;
  ya?: number;
  xb?: number;
  yb?: number;
  options?: [string];
}

export class CommandBuffer {
  public static init() {
    const storage = window.localStorage;
    if(storage === undefined) {
      console.warn("window.localStorage not avaliable");
      return;
    }

    const commands = storage.getItem("commandBuffer");
    if(!commands) {
      console.warn("No commandBuffer in window.localStorage");
      return;
    }

    CommandBuffer.buffer = JSON.parse(commands);

    while(CommandBuffer.redoAvaliable()) {
      CommandBuffer.redo();
    }
  }

  public static save() {
    const storage = window.localStorage;
    if(storage === undefined) {
      return;
    }

    storage.removeItem("commandBuffer");
    const data = JSON.stringify(CommandBuffer.buffer);
    console.log("saving: ", data);
    storage.setItem("commandBuffer", data);
  }

  public static push(command: ICommand) {
    const lastCommand = CommandBuffer.buffer[CommandBuffer.pointer -1];
    if(lastCommand &&
       lastCommand.name === command.name &&
      lastCommand.action === command.action) {
      if(Date.now() - lastCommand.time > coalesceTime) {
        CommandBuffer.bufferPush(command);
      } else {
        command.time = lastCommand.time;
        CommandBuffer.pointer--;
        CommandBuffer.bufferPush(command);
      }
    } else {
      CommandBuffer.bufferPush(command);
    }

    CommandBuffer.callbacks.forEach((callback) => {
      callback(command);
    });
  }

  public static pushCallback(callback: (command: ICommand) => void) {
    CommandBuffer.callbacks.push(callback);
  }

  public static summary()/*: [string]*/ {
    /*const output: [string] = [] as [string];
    CommandBuffer.buffer.forEach((command, index) => {
      let out = command.action + " " + command.name;
      if(index === CommandBuffer.pointer -1) {
        out += " <<<";
      }
      output.push(out);
    });
    return output;*/
    return CommandBuffer.buffer;
  }

  public static undo() {
    CommandBuffer.pointer--;
    if(CommandBuffer.pointer < 0) {
      CommandBuffer.pointer = 0;
      return;
    }
    const lastCommand = CommandBuffer.buffer[CommandBuffer.pointer];
    console.assert(lastCommand !== undefined,
                   "invalid command at " + CommandBuffer.pointer);
    let targetCommand;
    if(lastCommand.action === "lineNew") {
      targetCommand = {
        action: "lineDelete",
        name: lastCommand.name,
        rib: lastCommand.rib,
        time: lastCommand.time,
      };
    } else if(lastCommand.action === "lineMove") {
      const previousCommand = CommandBuffer.findPrevious(lastCommand.name);
      if(!previousCommand) {
        return;
      }
      console.log(previousCommand);
      let options: string[] = [] as string[];
      if(previousCommand.options !== undefined) {
        options = previousCommand.options.slice();
      }
      targetCommand = {
        action: "lineMove",
        name: lastCommand.name,
        rib: lastCommand.rib,
        time: previousCommand.time,
        xa: previousCommand.xa,
        ya: previousCommand.ya,
        xb: previousCommand.xb,
        yb: previousCommand.yb,
        options,
      };
    } else if(lastCommand.action === "changeRib") {
      targetCommand = CommandBuffer.findPrevious(lastCommand.name);
      if(targetCommand === undefined) {
        targetCommand = {
          action: "changeRib",
          name: "changeRib",
          time: CommandBuffer.buffer[0].time,
          rib: 0,
        };
      }
    }
    CommandBuffer.callbacks.forEach((callback) => {
      callback(targetCommand);
    });
  }

  public static redo() {
    CommandBuffer.pointer++;
    if(CommandBuffer.pointer > CommandBuffer.buffer.length) {
      CommandBuffer.pointer = CommandBuffer.buffer.length;
      return;
    }

    const nextCommand = CommandBuffer.buffer[CommandBuffer.pointer -1];
    console.assert(nextCommand !== undefined,
                   "invalid command at " + (CommandBuffer.pointer -1));
    const nextIndex = parseInt(nextCommand.name.split("_")[1], 10);
    console.log(nextCommand.name, nextIndex);
    if(nextIndex >= MovableLine.counter) {
      MovableLine.counter = nextIndex +1;
    }
    CommandBuffer.callbacks.forEach((callback) => {
      callback(nextCommand);
    });
  }

  public static undoAvaliable() {
    return CommandBuffer.pointer > 0;
  }

  public static redoAvaliable() {
    return CommandBuffer.pointer < CommandBuffer.buffer.length;
  }

  private static buffer: [ICommand] = [] as [ICommand];
  private static pointer: number = 0;
  private static callbacks: [(command: ICommand) => void] =
    [] as [(command: ICommand) => void];

  private static bufferPush(command: ICommand) {
    console.assert(CommandBuffer.pointer <= CommandBuffer.buffer.length,
                   "invalid buffer index: " + CommandBuffer.pointer);

    if(CommandBuffer.pointer === CommandBuffer.buffer.length) {
      CommandBuffer.buffer.push(command);
      CommandBuffer.pointer++;
      return;
    }
    CommandBuffer.buffer[CommandBuffer.pointer] = command;
    CommandBuffer.pointer++;
    CommandBuffer.buffer.splice(CommandBuffer.pointer);
  }

  private static findPrevious(name: string) {
    for(let i = CommandBuffer.pointer -1; i >= 0; --i) {
      if(CommandBuffer.buffer[i].name === name) {
        return CommandBuffer.buffer[i];
      }
    }
  }
}
