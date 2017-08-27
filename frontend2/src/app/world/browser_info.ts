// Copyright 2017 duncan law (mrdunk@gmail.com)


declare var platform;

interface ISystemData {
  sessionId?: string;
  hardwareConcurrency?: number;
  workerType?: string;
  state_starting?: boolean;
  state_running?: boolean;
  state_closing?: boolean;
  state_closed?: boolean;
  cleanShutdown?: boolean;
}

// https://stackoverflow.com/a/105074/2669284
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + "-" + s4() + "-" + s4() + "-" +
    s4() + "-" + s4() + s4() + s4();
}

class BrowserInfo {
  private data: ISystemData = {};
  private start: number = Date.now();
  private client;
  private db;

  constructor() {
    const keys = ["name", "manufacturer", "layout", "description", "version" ];
    keys.forEach((key) => {
      if(platform[key]) {
        this.data[key] = platform[key];
      }
    });

    const osKeys = ["architecture", "family", "version"];
    osKeys.forEach((key) => {
      if(platform.os[key]) {
        this.data["os_" + key] = platform.os[key];
      }
    });

    this.data["start_time"] = Date();
    this.data.sessionId = guid();
    this.data.hardwareConcurrency = window.navigator.hardwareConcurrency;
    this.data.workerType = workerType;

    // GameAnalytics("setEnabledInfoLog", true);
    // GameAnalytics("setEnabledVerboseLog", true);
    // GameAnalytics("configureBuild", "0.0.1");
    // GameAnalytics("initialize", GAME_KEY, SECRET_KEY);
    // GameAnalytics("addProgressionEvent", "Start", "world01");

    this.client = new stitch.StitchClient("got-yyggd");
    this.db = this.client.service("mongodb", "mongodb-atlas").db("got");
    this.client.login().then(function() {
      console.log(this.client.authedId(), this.client.userProfile());
    }.bind(this));

    // If a previous session's data is in Localstorage, retreive and push to DB.
    this.pullLocalStorage();

    // Push this session to DB.
    this.data.state_starting = true;
    this.pushMongo();
    this.data.state_running = true;
    setTimeout(this.pushMongo.bind(this), 10000);  // 10 seconds.
    setTimeout(this.pushMongo.bind(this), 60000);  // 60 seconds.
    setTimeout(this.pushMongo.bind(this), 600000);  // 10 minutes.

    window.addEventListener("beforeunload", this.unloadPage.bind(this));
  }

  public service() {
    this.data["fps_frame"] = Math.round(MainLoop.FPS * 100) / 100;
    this.data["fps_average"] = Math.round(MainLoop.averageFPS * 100) / 100;
    this.data["fps_long"] = Math.round(MainLoop.longAverageFPS * 100) / 100;
    this.data["run_time"] = Math.round((Date.now() - this.start) / 1000);
    // GameAnalytics("addDesignEvent", "engine:FPS", this.data["fps"]);

    this.pushLocalStorage();
  }

  public displayText(): string {
    this.service();
    let returnString = "";
    for(const key in this.data) {
      if(this.data.hasOwnProperty(key) && this.data[key] !== undefined) {
        returnString += key + ": " + this.data[key] + "\n\r";
      }
    }
    return returnString;
  }

  public returnHtml(): HTMLElement {
    this.service();
    const content = document.createElement("div");
    for(const key in this.data) {
      if(this.data.hasOwnProperty(key) && this.data[key] !== undefined) {
        const div = document.createElement("div");
        content.appendChild(div);
        div.innerHTML = key + ": " + this.data[key];
      }
    }

    const authDiv = document.createElement("div");
    content.appendChild(authDiv);
    authDiv.innerHTML = "MongoDB_authID: " + this.client.authedId();

    return content;
  }

  public returnJson() {
    return JSON.stringify(this.data);
  }

  private pushMongo(data?: {}) {
    if(window.location.hash.includes("no_mongo")) {
      return;
    }
    if(data === undefined) {
      this.service();
      data = this.data;
    }

    this.db.collection("sessions").insert({owner_id : this.client.authedId(),
                                           comment: data})
      .then(() => {console.log("sent data");},
            () => {console.log("error");});
  }

  private pushLocalStorage() {
    localStorage.setItem("sessionData", JSON.stringify(this.data));
  }

  /* If a previous instance on this brouser left a cache behind, push it to the
   * DB. */
  private pullLocalStorage() {
    const data = localStorage.getItem("sessionData");
    if(data !== undefined && data !== null) {
      const jsonData: ISystemData = JSON.parse(data);
      console.log("Pushing previous session data to MongoDb.", jsonData);
      if(jsonData.state_closing = true) {
        jsonData.cleanShutdown = true;
      }
      jsonData.state_closed = true;
      this.pushMongo(jsonData);
      localStorage.removeItem("sessionData");
    }
  }

  private unloadPage() {
    console.log("BrowserInfo.unloadPage()");
    // GameAnalytics("addProgressionEvent", "Complete", "world01");
    // GameAnalytics("session_end");

    this.data.state_closing = true;
    this.pushLocalStorage();
    console.log("BrowserInfo.unloadPage() done");
  }
}
