// Copyright 2017 duncan law (mrdunk@gmail.com)

declare var Module: {
  IndexAtRecursion: (iHigh: number, iLow: number, r: number) => number[];
  IndexOfChild:
    (iHigh: number, iLow: number, recursion: number, child: number) => number[];
  DataSourceGenerate: () => void;
};

interface IFace {
  indexHigh: number;
  indexLow: number;
  recursion: number;
  height?: number;
  points?: IPoint[];
}

interface ITile {
  indexHigh: number;
  indexLow: number;
  recursion: number;
}

interface IGenerateTileTask extends ITile {
  type?: string;
  parent?: boolean;
  neighbours?: boolean;
  children?: boolean;
}

interface ITileTaskHash {
  [tileLabel: string]: IGenerateTileTask;
}

interface ICustomInputEvent {
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

interface IPoint {
  point: THREE.Vector3;
  height?: number;
  face?: IFace;
}


