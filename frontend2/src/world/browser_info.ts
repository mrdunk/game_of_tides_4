// Copyright 2017 duncan law (mrdunk@gmail.com)


declare var stitch;
import * as platform from "platform";
import {Globals} from "./globals";
import {MainLoop} from "./main_loop";

interface ISystemData {
  sessionId?: string;
  hardwareConcurrency?: number;
  workerType?: string;
  state?: string;
  cleanShutdown?: boolean;
  startTime?: string;
  startupDuration?: number;
  runDuration?: number;
  uploading?: boolean;
  fpsFrame?: number;
  fpsLong?: number;
  fpsAverage?: number;
  owner_id?: string;   // Variable name must match MongoDB user_id.
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

export class BrowserInfo {
  public db;
  private data: ISystemData = {};
  private start: number = Date.now();

  constructor() {
    const keys = ["name", "manufacturer", "layout", "description", "version" ];
    keys.forEach((key) => {
      if(platform[key] !== undefined) {
        this.data[key] = platform[key];
      }
    });

    const osKeys = ["architecture", "family", "version"];
    osKeys.forEach((key) => {
      if(platform.os[key] !== undefined) {
        this.data["os_" + key] = platform.os[key];
      }
    });

    this.data.startTime = Date();
    this.data.sessionId = guid();
    this.data.hardwareConcurrency = window.navigator.hardwareConcurrency;
    this.data.workerType = Globals.workerType;
    this.data.uploading = false;

    // if(window.location.hostname !== "localhost") {
      this.mongoLogin();
    // }
    setInterval(this.service.bind(this), 10000);
  }

  public mongoLogin() {
    try {

      const clientPromise = stitch.StitchClientFactory.create("got-yyggd");
      clientPromise.then((client) => {
        this.db = client.service("mongodb", "mongodb-atlas").db("got");
        client.login().then(() => {
          console.log(client.authedId(), client.userProfile());

          // If a previous session"s data is in Localstorage, retrieve and push
          // to DB.
          this.pullLocalStorage();

          // Push this session to DB.
          this.data.owner_id = client.authedId();
          this.data.state = "starting";
          this.pushMongo();
          this.data.state = "running";
          setTimeout(this.pushMongo.bind(this), 10000);  // 10 seconds.
          setTimeout(this.pushMongo.bind(this), 60000);  // 60 seconds.
          setTimeout(this.pushMongo.bind(this), 600000);  // 10 minutes.

          window.addEventListener("beforeunload", this.unloadPage.bind(this));
          this.data.uploading = true;
        }).catch((err) => {
          this.data.uploading = false;
          console.error(err);
        });
      });
    } catch(error) {
      this.data.uploading = false;
      console.error(error);
    }
  }

  public update() {
    this.data.startupDuration = Math.round(Globals.startupDuration);
    this.data.fpsFrame = Math.round(MainLoop.FPS * 100) / 100;
    this.data.fpsAverage = Math.round(MainLoop.averageFPS * 100) / 100;
    this.data.fpsLong = Math.round(MainLoop.longAverageFPS * 100) / 100;
    this.data.runDuration = Math.round((Date.now() - this.start) / 1000);
  }

  public service() {
    this.update();
    this.pushLocalStorage();
  }

  public displayText(): string {
    this.update();
    let returnString = "";
    for(const key in this.data) {
      if(this.data.hasOwnProperty(key) && this.data[key] !== undefined) {
        returnString += key + ": " + this.data[key] + "\n\r";
      }
    }
    return returnString;
  }

  public returnHtml(): HTMLElement {
    this.update();
    const content = document.createElement("div");
    for(const key in this.data) {
      if(this.data.hasOwnProperty(key) && this.data[key] !== undefined) {
        const div = document.createElement("div");
        content.appendChild(div);
        div.innerHTML = key + ": " + this.data[key];
      }
    }

    return content;
  }

  public returnJson() {
    return JSON.stringify(this.data);
  }

  private pushMongo(data?: ISystemData) {
    if(window.location.hash.includes("no_mongo")) {
      return;
    }
    if(data === undefined) {
      this.service();
      data = this.data;
    }

    this.db.collection("sessions").updateOne(
      {sessionId: data.sessionId},
      data,
      {upsert: true})
      .then(() => {console.log("sent data");},
            (e) => {console.log("error:", e);});

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
      console.log("Pushing previous session data to MongoDb.", data);
      if(jsonData.state === "closing") {
        jsonData.cleanShutdown = true;
      }
      jsonData.state = "closed";
      this.pushMongo(jsonData);
      localStorage.removeItem("sessionData");
    }
  }

  private unloadPage() {
    console.log("BrowserInfo.unloadPage()");
    this.data.state = "closing";
    this.service();
    console.log("BrowserInfo.unloadPage() done");
  }
}
