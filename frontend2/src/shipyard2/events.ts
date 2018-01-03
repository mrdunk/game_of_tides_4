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

/* Events are implemented as Classes rather than TypeScript Interfaces so we
 * can tell what kind of Event is being passed (typeof eventInstacen).
 * If we used Interfaces for this we would need to pass a variable containing
 * the Event type as part of the Interface and set it manually every time a new
 * Event is declared. */

export class EventBase {
  public readonly widgetType: string;  // Widget type where Event originates.
  public __name__?: string;

  constructor(args: EventBase) {
    this.widgetType = args.widgetType;
  }

  public toJSON(key) {
    this.__name__ = this.constructor.name;
    return this;
  }
}

export class EventUiSelectRib extends EventBase {
  public z: number;

  constructor(args: EventUiSelectRib) {
    super(args);
    this.z = args.z;
  }
}

export class EventUiMouseMove extends EventBase {
  public startPoint: IPoint;
  public lineId?: string;
  public lineEnd?: LineEnd;

  constructor(args: EventUiMouseMove) {
    super(args);
    this.startPoint = args.startPoint;
    this.lineId = args.lineId;
    this.lineEnd = args.lineEnd;
  }
}

export class EventUiMouseDrag extends EventBase {
  public readonly sequence: string; // Unique id for series of related commands.
  public startPoint: IPoint;
  public finishPoint: IPoint;
  public lineId?: string;
  public lineEnd?: LineEnd;

  constructor(args: EventUiMouseDrag) {
    super(args);
    this.sequence = args.sequence;
    this.startPoint = args.startPoint;
    this.finishPoint = args.finishPoint;
    this.lineId = args.lineId;
    this.lineEnd = args.lineEnd;
  }
}

export class EventUiInputElement extends EventBase {
  public label: string;
  public elementType: string;
  public valueText?: string;
  public valueBool?: boolean;

  constructor(args: EventUiInputElement) {
    super(args);
    this.label = args.label;
    this.elementType = args.elementType;
    this.valueText = args.valueText;
    this.valueBool = args.valueBool;
  }
}

export class EventLineModify extends EventUiMouseDrag {}
export class EventLineNew extends EventUiMouseDrag {}

export class EventLineSelect extends EventBase {
  public lineId?: string;

  constructor(args: EventLineSelect) {
    super(args);
    this.lineId = args.lineId;
  }
}

export class EventLineHighlight extends EventBase {
  public lineId?: string;

  constructor(args: EventLineHighlight) {
    super(args);
    this.lineId = args.lineId;
  }
}

export class EventLineDelete extends EventBase {
  public lineId?: string;

  constructor(args: EventLineDelete) {
    super(args);
    this.lineId = args.lineId;
  }
}

export class EventLineMirror extends EventBase {
  public lineId?: string;

  constructor(args: EventLineMirror) {
    super(args);
    this.lineId = args.lineId;
  }
}


