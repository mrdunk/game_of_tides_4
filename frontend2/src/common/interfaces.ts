// Copyright 2017 duncan law (mrdunk@gmail.com)

declare global {
  interface Window {
    Module: {
      IndexAtRecursion: (iHigh: number, iLow: number, r: number) => number[];
      IndexOfChild: (iHigh: number,
                     iLow: number,
                     recursion: number,
                     child: number) => number[];
      DataSourceGenerate: () => void;
    }
  }
}

export interface IFace {
  indexHigh: number;
  indexLow: number;
  recursion: number;
  height?: number;
  points?: IPoint[];
}

export interface ITile {
  indexHigh: number;
  indexLow: number;
  recursion: number;
  batch?: number;
}

export interface IGenerateTileTask extends ITile {
  type?: string;
  parent?: boolean;
  neighbours?: boolean;
  children?: boolean;
}

export interface ITileTaskHash {
  [tileLabel: string]: IGenerateTileTask;
}

export interface ICustomInputEvent {
  type: string;
  origin?: number[];
  direction?: number[];
  size?: number;
  shiftKey?: number;
  ctrlKey?: number;
  altKey?: number;
  key?: string;
  target?: HTMLElement;
  value?: string | number | boolean;
  face?: IFace;
}

export interface IPoint {
  point: THREE.Vector3;
  height?: number;
  face?: IFace;
}


