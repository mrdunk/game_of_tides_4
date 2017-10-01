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
  public static ribPositions: {} = {0: 0};
  public static positionRib: {} = {0: 0};

  public static push(component: IComponent) {
    if(component.rib === ComponentBuffer.nextRib) {
      ComponentBuffer.nextRib++;
    }
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

  public static closestRib(queryPos: number) {
    let closestPos: number;
    let closestRib: number;
    let closestDistance: number;
    for(const pos in ComponentBuffer.ribPositions) {
      if(ComponentBuffer.ribPositions.hasOwnProperty(pos)) {
        const distance = Math.abs(queryPos - parseFloat(pos));
        if(closestDistance === undefined || distance <= closestDistance) {
          closestDistance = distance;
          closestPos = parseFloat(pos);
          closestRib = ComponentBuffer.ribPositions[pos];
        }
      }
    }
    return {position: closestPos, rib: closestRib, distance: closestDistance};
  }

  public static setRibPosition(position: number, rib: number) {
    for(const pos in ComponentBuffer.ribPositions) {
      if(ComponentBuffer.ribPositions.hasOwnProperty(pos) &&
         ComponentBuffer.ribPositions[pos] === rib) {
        delete ComponentBuffer.ribPositions[pos];
      }
    }
    ComponentBuffer.ribPositions[position] = rib;
    ComponentBuffer.positionRib[rib] = position;
  }

  public static newRib(position: number) {
    ComponentBuffer.setRibPosition(position, ComponentBuffer.nextRib);
    return ComponentBuffer.nextRib;
  }

  public static show() {
    return ComponentBuffer.buffer;
  }

  private static nextRib: number = 0;
}

