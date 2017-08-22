// Copyright 2017 duncan law (mrdunk@gmail.com)

class BrowserInfo {
  private data = {};
  private start: number = Date.now();

  constructor() {
    const keys = ["name", "manufacturer", "layout", "description", "version" ];
    keys.forEach((key) => {
      if(platform[key]){
        this.data[key] = platform[key];
      }
    });

    const osKeys = ["architecture", "family", "version"];
    osKeys.forEach((key) => {
      if(platform.os[key]){
        this.data["os_" + key] = platform.os[key];
      }
    });

    this.data["start_time"] = Date();
    
    // GameAnalytics("setEnabledInfoLog", true);
    // GameAnalytics("setEnabledVerboseLog", true);
    GameAnalytics("configureBuild", "0.0.1");
    GameAnalytics("initialize", GAME_KEY, SECRET_KEY);
    GameAnalytics("addProgressionEvent", "Start", "world01");
    window.addEventListener("beforeunload", this.unloadPage.bind(this));
  }

  public service() {
    this.data["fps"] = Math.round(MainLoop.longAverageFPS * 100) / 100;
    this.data["run_time"] = Math.round((Date.now() - this.start) / 1000);
    GameAnalytics("addDesignEvent", "engine:FPS", this.data["fps"]);
  }

  public displayText(): string {
    this.service();
    let returnString = "";
    for(const key in this.data) {
      if(this.data.hasOwnProperty(key) && this.data[key]) {
        returnString += key + ": " + this.data[key] + "\n\r";
      }
    }
    return returnString;
  }

  public returnHtml(): HTMLElement {
    this.service();
    const content = document.createElement("div");
    for(const key in this.data) {
      if(this.data.hasOwnProperty(key) && this.data[key]) {
        const div = document.createElement("div");
        content.appendChild(div);
        div.innerHTML = key + ": " + this.data[key];
      }
    }
    return content;
  }

  private unloadPage() {
    console.log("BrowserInfo.unloadPage()");
    GameAnalytics("addProgressionEvent", "Complete", "world01");
    GameAnalytics("session_end");
  }
}
