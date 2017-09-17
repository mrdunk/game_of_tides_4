// Copyright 2017 duncan law (mrdunk@gmail.com)

import * as Konva from "konva";

export interface IComponent {
  name: string;
  rib?: number;
  xa?: number;
  ya?: number;
  xb?: number;
  yb?: number;
  options?: [string];
}

interface IComponentDB {
  [rib: number]: {
    [name: string]: IComponent;
  };
}

export class ComponentBuffer {
  public static buffer: IComponentDB = {};

  public static push(component: IComponent) {
    if(ComponentBuffer.buffer[component.rib] === undefined) {
      ComponentBuffer.buffer[component.rib] = {};
    }
    ComponentBuffer.buffer[component.rib][component.name] = component;
  }

  public static remove(rib: number, name: string) {
    if(ComponentBuffer.buffer[rib] !== undefined) {
      delete ComponentBuffer.buffer[rib][name];
    }
  }

  public static show() {
    return ComponentBuffer.buffer;
  }
}

