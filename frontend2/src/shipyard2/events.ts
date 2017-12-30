// Copyright 2017 duncan law (mrdunk@gmail.com)

import { IPoint } from "./controller";

export enum LineEnd {
  A1,
  B1,
  A2,
  B2,
  Line1,
  Line2,
}

export interface IEventBase {
  readonly widgetType: string;      // Command originating widget type.
}
export class EventBase implements IEventBase {
  public readonly widgetType: string;

  constructor(args: IEventBase) {
    this.widgetType = args.widgetType;
  }
}

export interface IEventUiMouseOver extends IEventBase {
  lineId?: string;
}

export interface IEventUiDelete extends IEventBase {
  lineId?: string;
}
export class EventUiDelete extends EventBase implements IEventUiDelete {
  public lineId?: string;

  constructor(args: IEventUiDelete) {
    super(args);
    this.lineId = args.lineId;
  }
}

export interface IEventUiMirror extends IEventBase {
  lineId?: string;
}
export class EventUiMirror extends EventBase implements IEventUiMirror {
  public lineId?: string;

  constructor(args: IEventUiMirror) {
    super(args);
    this.lineId = args.lineId;
  }
}

export interface IEventUiSelectRib extends IEventBase {
  z: number;
}
export class EventUiSelectRib extends EventBase implements IEventUiSelectRib {
  public z: number;

  constructor(args: IEventUiSelectRib) {
    super(args);
    this.z = args.z;
  }
}

export interface IEventUiMouseMove extends IEventBase {
  startPoint: IPoint;
  lineId?: string;
  lineEnd?: LineEnd;
}
export class EventUiMouseMove extends EventBase implements IEventUiMouseMove {
  public startPoint: IPoint;
  public lineId?: string;
  public lineEnd?: LineEnd;

  constructor(args: IEventUiMouseMove) {
    super(args);
    this.startPoint = args.startPoint;
    this.lineId = args.lineId;
    this.lineEnd = args.lineEnd;
  }
}

export interface IEventUiMouseDrag extends IEventBase {
  readonly sequence: string;        // Unique id for series of related commands.
  startPoint: IPoint;
  finishPoint: IPoint;
  lineId?: string;
  lineEnd?: LineEnd;
}
export class EventUiMouseDrag extends EventBase implements IEventUiMouseDrag {
  public readonly sequence: string; // Unique id for series of related commands.
  public startPoint: IPoint;
  public finishPoint: IPoint;
  public lineId?: string;
  public lineEnd?: LineEnd;

  constructor(args: IEventUiMouseDrag) {
    super(args);
    this.sequence = args.sequence;
    this.startPoint = args.startPoint;
    this.finishPoint = args.finishPoint;
    this.lineId = args.lineId;
    this.lineEnd = args.lineEnd;
  }
}

export interface IEventUiInputElement extends IEventBase {
  label: string;
  elementType: string;
  valueText?: string;
  valueBool?: boolean;
}
export class EventUiInputElement extends EventBase
    implements IEventUiInputElement {
  public label: string;
  public elementType: string;
  public valueText?: string;
  public valueBool?: boolean;

  constructor(args: IEventUiInputElement) {
    super(args);
    this.label = args.label;
    this.elementType = args.elementType;
    this.valueText = args.valueText;
    this.valueBool = args.valueBool;
  }
}

