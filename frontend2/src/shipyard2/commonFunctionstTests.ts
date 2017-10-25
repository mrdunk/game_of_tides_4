// Copyright 2017 duncan law (mrdunk@gmail.com)

export class LoggerMock {
  public lastLog;
  public lastWarn;

  public log(...output) {
    console.log(this.concatVariables(output));
    this.lastLog = output;
  }

  public warn(...output) {
    console.warn(this.concatVariables(output));
    this.lastWarn = output;
  }

  private concatVariables(input): string {
    let output = "";
    input.forEach((peramiter) => {
      output += String(peramiter) + " ";
    });
    return output;
  }
}

export class TrackAsserts {
  public static value: boolean = true;

  public static assert(value: boolean) {
    this.value = this.value && value;
    console.assert(value);
  }
}


