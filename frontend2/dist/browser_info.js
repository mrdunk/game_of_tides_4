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
var BrowserInfo = (function () {
    function BrowserInfo() {
        var _this = this;
        this.data = {};
        this.start = Date.now();
        var keys = ["name", "manufacturer", "layout", "description", "version"];
        keys.forEach(function (key) {
            if (platform[key]) {
                _this.data[key] = platform[key];
            }
        });
        var osKeys = ["architecture", "family", "version"];
        osKeys.forEach(function (key) {
            if (platform.os[key]) {
                _this.data["os_" + key] = platform.os[key];
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
        this.client.login().then(function () {
            console.log(this.client.authedId(), this.client.userProfile());
        }.bind(this));
        // If a previous session's data is in Localstorage, retreive and push to DB.
        this.pullLocalStorage();
        // Push this session to DB.
        this.data.state = "starting";
        this.pushMongo();
        this.data.state = "running";
        setTimeout(this.pushMongo.bind(this), 10000); // 10 seconds.
        setTimeout(this.pushMongo.bind(this), 60000); // 60 seconds.
        setTimeout(this.pushMongo.bind(this), 600000); // 10 minutes.
        window.addEventListener("beforeunload", this.unloadPage.bind(this));
    }
    BrowserInfo.prototype.service = function () {
        this.data["fps_frame"] = Math.round(MainLoop.FPS * 100) / 100;
        this.data["fps_average"] = Math.round(MainLoop.averageFPS * 100) / 100;
        this.data["fps_long"] = Math.round(MainLoop.longAverageFPS * 100) / 100;
        this.data["run_time"] = Math.round((Date.now() - this.start) / 1000);
        // GameAnalytics("addDesignEvent", "engine:FPS", this.data["fps"]);
        this.pushLocalStorage();
    };
    BrowserInfo.prototype.displayText = function () {
        this.service();
        var returnString = "";
        for (var key in this.data) {
            if (this.data.hasOwnProperty(key) && this.data[key]) {
                returnString += key + ": " + this.data[key] + "\n\r";
            }
        }
        return returnString;
    };
    BrowserInfo.prototype.returnHtml = function () {
        this.service();
        var content = document.createElement("div");
        for (var key in this.data) {
            if (this.data.hasOwnProperty(key) && this.data[key]) {
                var div = document.createElement("div");
                content.appendChild(div);
                div.innerHTML = key + ": " + this.data[key];
            }
        }
        var authDiv = document.createElement("div");
        content.appendChild(authDiv);
        authDiv.innerHTML = "MongoDB_authID: " + this.client.authedId();
        return content;
    };
    BrowserInfo.prototype.returnJson = function () {
        return JSON.stringify(this.data);
    };
    BrowserInfo.prototype.pushMongo = function (data) {
        if (window.location.hash.includes("no_mongo")) {
            return;
        }
        if (data === undefined) {
            this.service();
            data = this.data;
        }
        this.db.collection("sessions").insert({ owner_id: this.client.authedId(),
            comment: data })
            .then(function () { console.log("sent data"); }, function () { console.log("error"); });
    };
    BrowserInfo.prototype.pushLocalStorage = function () {
        localStorage.setItem("sessionData", JSON.stringify(this.data));
    };
    /* If a previous instance on this brouser left a cache behind, push it to the
     * DB. */
    BrowserInfo.prototype.pullLocalStorage = function () {
        var data = localStorage.getItem("sessionData");
        if (data !== undefined && data !== null) {
            var jsonData = JSON.parse(data);
            console.log("Pushing previous session data to MongoDb.", jsonData);
            if (jsonData.state === "closing") {
                jsonData.cleanShutdown = true;
            }
            jsonData.state = "closed";
            this.pushMongo(jsonData);
            localStorage.removeItem("sessionData");
        }
    };
    BrowserInfo.prototype.unloadPage = function () {
        console.log("BrowserInfo.unloadPage()");
        // GameAnalytics("addProgressionEvent", "Complete", "world01");
        // GameAnalytics("session_end");
        this.data.state = "closing";
        this.pushLocalStorage();
        console.log("BrowserInfo.unloadPage() done");
    };
    return BrowserInfo;
}());
