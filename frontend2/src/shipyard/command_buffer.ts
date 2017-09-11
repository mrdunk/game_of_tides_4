// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";
import {Line} from "./primatives";

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
}

export class CommandBuffer {
  public static push(command: ICommand) {
    const lastCommand = CommandBuffer.buffer[CommandBuffer.pointer -1];
    if(lastCommand &&
       lastCommand.name === command.name &&
      lastCommand.action === command.action) {
      if(Date.now() - lastCommand.time > coalesceTime) {
        CommandBuffer.bufferPush(command);
        return;
      }
      command.time = lastCommand.time;
      CommandBuffer.pointer--;
      CommandBuffer.bufferPush(command);
      return;
    }
    CommandBuffer.bufferPush(command);
  }

  public static summary(): [string] {
    const output: [string] = [] as [string];
    CommandBuffer.buffer.forEach((command, index) => {
      let out = command.action + " " + command.name;
      if(index === CommandBuffer.pointer -1) {
        out += " <<<";
      }
      output.push(out);
    });
    return output;
  }

  public static undo(layers: [Konva.Layer]) {
    CommandBuffer.pointer--;
    if(CommandBuffer.pointer < 0) {
      CommandBuffer.pointer = 0;
      return;
    }
    const lastCommand = CommandBuffer.buffer[CommandBuffer.pointer];
    console.assert(lastCommand !== undefined,
                   "invalid command at " + CommandBuffer.pointer);

    layers.forEach((layer) => {
      const lines = layer.find("." + lastCommand.name);
      if(lastCommand.action === "lineNew") {
        lines.each((line) => {
          if(line) {
            if((line as Line).destroyChildren) {
              (line as Line).destroyChildren();
            }
            line.destroy();
          }
        });
      } else if(lastCommand.action === "lineMove") {
        lines.each((line) => {
          if(line && (line as Line).setPosition) {
            const previousCommand =
              CommandBuffer.findPrevious(lastCommand.name);
            if(previousCommand) {
              (line as Line).setPosition(previousCommand);
            }
          }
        });
      }
      layer.draw();
    });
  }

  public static redo(layers: [Konva.Layer]) {
    CommandBuffer.pointer++;
    if(CommandBuffer.pointer > CommandBuffer.buffer.length) {
      CommandBuffer.pointer = CommandBuffer.buffer.length;
      return;
    }

    const nextCommand = CommandBuffer.buffer[CommandBuffer.pointer -1];
    console.assert(nextCommand !== undefined,
                   "invalid command at " + (CommandBuffer.pointer -1));

    layers.forEach((layer) => {
      const lines = layer.find("." + nextCommand.name);
      if(nextCommand.action === "lineNew") {
        const line = new Line(nextCommand.rib, nextCommand.name);
        layer.add(line);
      } else if(nextCommand.action === "lineMove") {
        console.log(nextCommand.action);
        lines.each((line) => {
          console.log(line.name());
          if(line && (line as Line).setPosition) {
            const previousCommand =
              CommandBuffer.findPrevious(nextCommand.name);
            if(previousCommand) {
              (line as Line).setPosition(previousCommand);
            }
          }
        });
      }
      layer.draw();
    });
  }

  private static buffer: [ICommand] = [] as [ICommand];
  private static pointer: number = 0;

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
