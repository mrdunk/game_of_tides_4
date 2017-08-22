// Copyright 2017 duncan law (mrdunk@gmail.com)
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
        // GameAnalytics("setEnabledInfoLog", true);
        // GameAnalytics("setEnabledVerboseLog", true);
        GameAnalytics("configureBuild", "0.0.1");
        GameAnalytics("initialize", GAME_KEY, SECRET_KEY);
        GameAnalytics("addProgressionEvent", "Start", "world01");
        window.addEventListener("beforeunload", this.unloadPage.bind(this));
    }
    BrowserInfo.prototype.service = function () {
        this.data["fps"] = Math.round(MainLoop.longAverageFPS * 100) / 100;
        this.data["run_time"] = Math.round((Date.now() - this.start) / 1000);
        GameAnalytics("addDesignEvent", "engine:FPS", this.data["fps"]);
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
        return content;
    };
    BrowserInfo.prototype.unloadPage = function () {
        console.log("BrowserInfo.unloadPage()");
        GameAnalytics("addProgressionEvent", "Complete", "world01");
        GameAnalytics("session_end");
    };
    return BrowserInfo;
}());
