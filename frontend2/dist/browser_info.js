// Copyright 2017 duncan law (mrdunk@gmail.com)
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
    constructor() {
        this.data = {};
        this.start = Date.now();
        const keys = ["name", "manufacturer", "layout", "description", "version"];
        keys.forEach((key) => {
            if (platform[key] !== undefined) {
                this.data[key] = platform[key];
            }
        });
        const osKeys = ["architecture", "family", "version"];
        osKeys.forEach((key) => {
            if (platform.os[key] !== undefined) {
                this.data["os_" + key] = platform.os[key];
            }
        });
        this.data["start_time"] = Date();
        this.data.sessionId = guid();
        this.data.hardwareConcurrency = window.navigator.hardwareConcurrency;
        this.data.workerType = workerType;
        this.client = new stitch.StitchClient("got-yyggd");
        this.db = this.client.service("mongodb", "mongodb-atlas").db("got");
        this.client.login().then(() => {
            console.log(this.client.authedId(), this.client.userProfile());
            // If a previous session's data is in Localstorage, retrieve and push to DB.
            this.pullLocalStorage();
            // Push this session to DB.
            this.data["owner_id"] = this.client.authedId();
            this.data.state = "starting";
            this.pushMongo();
            this.data.state = "running";
            setTimeout(this.pushMongo.bind(this), 10000); // 10 seconds.
            setTimeout(this.pushMongo.bind(this), 60000); // 60 seconds.
            setTimeout(this.pushMongo.bind(this), 600000); // 10 minutes.
            window.addEventListener("beforeunload", this.unloadPage.bind(this));
        });
        setInterval(this.service.bind(this), 10000);
    }
    update() {
        this.data["fps_frame"] = Math.round(MainLoop.FPS * 100) / 100;
        this.data["fps_average"] = Math.round(MainLoop.averageFPS * 100) / 100;
        this.data["fps_long"] = Math.round(MainLoop.longAverageFPS * 100) / 100;
        this.data["run_time"] = Math.round((Date.now() - this.start) / 1000);
    }
    service() {
        this.update();
        this.pushLocalStorage();
    }
    displayText() {
        this.update();
        let returnString = "";
        for (const key in this.data) {
            if (this.data.hasOwnProperty(key) && this.data[key] !== undefined) {
                returnString += key + ": " + this.data[key] + "\n\r";
            }
        }
        return returnString;
    }
    returnHtml() {
        this.update();
        const content = document.createElement("div");
        for (const key in this.data) {
            if (this.data.hasOwnProperty(key) && this.data[key] !== undefined) {
                const div = document.createElement("div");
                content.appendChild(div);
                div.innerHTML = key + ": " + this.data[key];
            }
        }
        const authDiv = document.createElement("div");
        content.appendChild(authDiv);
        return content;
    }
    returnJson() {
        return JSON.stringify(this.data);
    }
    pushMongo(data) {
        if (window.location.hash.includes("no_mongo")) {
            return;
        }
        if (data === undefined) {
            this.service();
            data = this.data;
        }
        this.db.collection("sessions").updateOne({ "sessionId": data.sessionId }, data, { upsert: true })
            .then(() => { console.log("sent data"); }, (e) => { console.log("error:", e); });
    }
    pushLocalStorage() {
        localStorage.setItem("sessionData", JSON.stringify(this.data));
    }
    /* If a previous instance on this brouser left a cache behind, push it to the
     * DB. */
    pullLocalStorage() {
        const data = localStorage.getItem("sessionData");
        if (data !== undefined && data !== null) {
            const jsonData = JSON.parse(data);
            console.log("Pushing previous session data to MongoDb.", data);
            if (jsonData.state === "closing") {
                jsonData.cleanShutdown = true;
            }
            jsonData.state = "closed";
            this.pushMongo(jsonData);
            localStorage.removeItem("sessionData");
        }
    }
    unloadPage() {
        console.log("BrowserInfo.unloadPage()");
        this.data.state = "closing";
        this.service();
        console.log("BrowserInfo.unloadPage() done");
    }
}
