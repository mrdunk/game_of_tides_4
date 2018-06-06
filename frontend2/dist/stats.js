(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright 2017 duncan law (mrdunk@gmail.com)
function clearSessions() {
    const clientPromise = stitch.StitchClientFactory.create("got-yyggd");
    clientPromise.then((client) => {
        if (window.location.hash.substr(1) === "login") {
            client.authenticate("google", { redirectUrl: "?clear" });
        }
        client.login().then(() => {
            if (!client.isAuthenticated()) {
                console.warn("Not authenticated");
                return;
            }
            client.userProfile().then((userData) => {
                if (!userData.data.email) {
                    console.warn("No user data.");
                    return;
                }
                console.log("authenticated");
                console.log(userData.data);
                const db = client.service("mongodb", "mongodb-atlas").db("got");
                client.login().then(() => {
                    console.log("authenticated");
                    console.log(client.authedId(), client.userProfile());
                    client.login().then(() => {
                        db.collection("sessions").deleteMany({});
                    }).then((deleted) => {
                        console.log(deleted);
                    }).catch((err) => {
                        console.error(err);
                    });
                });
            });
        });
    });
}
function init() {
    const url = new URL(window.location.href);
    if (url.searchParams.get("raw") !== undefined &&
        url.searchParams.get("raw") !== null) {
        displaySessions(true);
    }
    else if (url.searchParams.get("summary") !== undefined &&
        url.searchParams.get("summary") !== null) {
        displaySummary();
    }
    else if (url.searchParams.get("clear") !== undefined &&
        url.searchParams.get("clear") !== null) {
        clearSessions();
    }
    else {
        displaySessions();
    }
}
function displaySessions(raw = false) {
    const clientPromise = stitch.StitchClientFactory.create("got-yyggd");
    clientPromise.then((client) => {
        client.login().then(() => {
            const db = client.service("mongodb", "mongodb-atlas").db("got");
            const sessions = db.collection("sessions");
            sessions.find({}).limit(1000).execute().then((result) => {
                if (raw) {
                    displayDataRaw(result);
                }
                else {
                    displayData(result);
                }
            });
        });
    });
    /*client.executePipeline({
      service: "mongodb-atlas",
      action: "aggregate",
      args: {
        database: "got",
        collection: "sessions",
        pipeline: [
          {
            $group: {
              _id: {
                name: "$name",
                os_family: "$os_family",
                version: "$version",
              },
              count: {
                $sum: 1,
              },
              run_time_average: {
                $avg: "$run_time",
              },
              fps_frame_average: {
                $avg: "$fps_frame",
              },
              fps_frame_stdDevPop: {
                $stdDevPop: "$fps_frame",
              },
              fps_frame_stdDevSamp: {
                $stdDevSamp: "$fps_frame",
              },
              fps_long_average: {
                $avg: "$fps_long",
              },
              fps_long_stdDevPop: {
                $stdDevPop: "$fps_long",
              },
              fps_long_stdDevSamp: {
                $stdDevSamp: "$fps_long",
              },
            },
          },
        ],
      },
    }, {
      allowDiskUse: true,
    })
      .then((result) => {
        console.log("success: ", result);
        displayData(result);
      })
      .catch((e) => {
        console.log("error: ", e);
      });*/
}
function displaySummary() {
    const clientPromise = stitch.StitchClientFactory.create("got-yyggd");
    clientPromise.then((client) => {
        client.login().then(() => {
            const db = client.service("mongodb", "mongodb-atlas").db("got");
            const sessions = db.collection("sessions");
            sessions.aggregate([
                { $match: { cleanShutdown: true } },
                { $group: { _id: "$description",
                        count: { $sum: 1 },
                        startupDurationAverage: { $avg: "$startupDuration" },
                        fpsAverageAverage: { $avg: "$fpsAverage" },
                        runDurationAverage: { $avg: "$runDuration" },
                    } }
            ]).then((result) => {
                console.log(result);
                displayDataRaw(result);
            });
        });
    });
}
const headings = [
    {
        group: "browser",
        key: "name",
        description: "name",
    },
    {
        group: "browser",
        key: "manufacturer",
        description: "manufacturer",
    },
    {
        group: "browser",
        key: "layout",
        description: "layout",
    },
    {
        group: "browser",
        key: "description",
        description: "Browser",
        visible: true,
    },
    {
        group: "browser",
        key: "version",
        description: "version",
    },
    {
        group: "browser",
        key: "os_architecture",
        description: "OS architecture",
    },
    {
        group: "browser",
        key: "os_family",
        description: "OS",
    },
    {
        group: "browser",
        key: "os_version",
        description: "OS version",
    },
    {
        group: "browser",
        key: "hardwareConcurrency",
        description: "available cores (TODO)",
    },
    {
        group: "browser",
        key: "workerType",
        description: "Web worker type",
    },
    {
        group: "session",
        key: "startTime",
        description: "",
        visible: true,
        required: true,
    },
    {
        group: "session",
        key: "sessionId",
        description: "",
    },
    {
        group: "session",
        key: "startupDuration",
        description: "",
        visible: true,
    },
    {
        group: "session",
        key: "fpsFrame",
        description: "",
    },
    {
        group: "session",
        key: "fpsAverage",
        description: "",
        visible: true,
    },
    {
        group: "session",
        key: "fpsLong",
        description: "",
        visible: true,
    },
    {
        group: "session",
        key: "runDuration",
        description: "",
        visible: true,
    },
    {
        group: "session",
        key: "state",
        description: "",
    },
    {
        group: "session",
        key: "cleanShutdown",
        description: "User returned.",
        visible: true,
    },
];
function displayData(data) {
    const element = document.getElementById("stats");
    const table = document.createElement("table");
    const tableBody = document.createElement("tbody");
    const tableHeadRow = document.createElement("tr");
    headings.forEach((heading) => {
        if (heading.visible) {
            const key = heading.key;
            const tableHeader = document.createElement("th");
            if (heading.description) {
                tableHeader.appendChild(document.createTextNode(heading.description));
            }
            else {
                tableHeader.appendChild(document.createTextNode(key));
            }
            tableHeadRow.appendChild(tableHeader);
        }
    });
    tableBody.appendChild(tableHeadRow);
    data.forEach((item) => {
        const tableRow = document.createElement("tr");
        const missingFields = [];
        headings.forEach((heading) => {
            const key = heading.key;
            if (heading.required && !item[key]) {
                missingFields.push(key);
            }
            if (heading.visible) {
                const tableData = document.createElement("td");
                tableData.appendChild(document.createTextNode(item[key]));
                tableRow.appendChild(tableData);
            }
        });
        if (missingFields.length === 0) {
            tableBody.appendChild(tableRow);
        }
        else {
            console.warn("Missing data in db for fields:", missingFields, item);
        }
    });
    table.appendChild(tableBody);
    element.innerHTML = "";
    element.appendChild(table);
}
function displayDataRaw(data) {
    const element = document.getElementById("stats");
    element.innerHTML = syntaxHighlight(data);
}
// https://stackoverflow.com/questions/4810841/how-can-i-pretty-print-json-using-javascript
function syntaxHighlight(json) {
    if (typeof json !== "string") {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = "number";
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = "key";
            }
            else {
                cls = "string";
            }
        }
        else if (/true|false/.test(match)) {
            cls = "boolean";
        }
        else if (/null/.test(match)) {
            cls = "null";
        }
        return "<span class=\"" + cls + "\">" + match + "</span>";
    });
}
window.onload = () => {
    init();
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc3RhdHMvc3RhdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSwrQ0FBK0M7QUFJL0M7SUFDRSxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3JFLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNO1FBRXhCLEVBQUUsQ0FBQSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBQyxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUVELE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUM7WUFFbEIsRUFBRSxDQUFBLENBQUMsQ0FBQyxNQUFNLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixPQUFPLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBQ2xDLE1BQU0sQ0FBQztZQUNULENBQUM7WUFDRCxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUTtnQkFDakMsRUFBRSxDQUFBLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQ3hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQzlCLE1BQU0sQ0FBQztnQkFDVCxDQUFDO2dCQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQzdCLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUUzQixNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsT0FB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Q0FBQztBQUNULENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgMjAxNyBkdW5jYW4gbGF3IChtcmR1bmtAZ21haWwuY29tKVxuXG5kZWNsYXJlIHZhciBzdGl0Y2g7XG5cbmZ1bmN0aW9uIGNsZWFyU2Vzc2lvbnMoKSB7XG4gIGNvbnN0IGNsaWVudFByb21pc2UgPSBzdGl0Y2guU3RpdGNoQ2xpZW50RmFjdG9yeS5jcmVhdGUoXCJnb3QteXlnZ2RcIik7XG4gIGNsaWVudFByb21pc2UudGhlbigoY2xpZW50KSA9PiB7XG5cbiAgICBpZih3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHIoMSkgPT09IFwibG9naW5cIikge1xuICAgICAgY2xpZW50LmF1dGhlbnRpY2F0ZShcImdvb2dsZVwiLCB7IHJlZGlyZWN0VXJsOiBcIj9jbGVhclwifSk7XG4gICAgfVxuXG4gICAgY2xpZW50LmxvZ2luKCkudGhlbigoKSA9PiB7XG5cbiAgICAgIGlmKCFjbGllbnQuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiTm90IGF1dGhlbnRpY2F0ZWRcIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNsaWVudC51c2VyUHJvZmlsZSgpLnRoZW4oKHVzZXJEYXRhKSA9PiB7XG4gICAgICAgIGlmKCF1c2VyRGF0YS5kYXRhLmVtYWlsKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKFwiTm8gdXNlciBkYXRhLlwiKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coXCJhdXRoZW50aWNhdGVkXCIpO1xuICAgICAgICBjb25zb2xlLmxvZyh1c2VyRGF0YS5kYXRhKTtcblxuICAgICAgICBjb25zdCBkYiA9IGNsaWVudC5zZXJ2aWNlKFwibW9uZ29kYlwiLCBcIm1vbmdvZGItYXRsYXNcIikuZGIoXCJnb3RcIik7XG4gICAgICAgIGNsaWVudC5sb2dpbigpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiYXV0aGVudGljYXRlZFwiKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhjbGllbnQuYXV0aGVkSWQoKSwgY2xpZW50LnVzZXJQcm9maWxlKCkpO1xuICAgICAgICAgIGNsaWVudC5sb2dpbigpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZGIuY29sbGVjdGlvbihcInNlc3Npb25zXCIpLmRlbGV0ZU1hbnkoe30pO1xuICAgICAgICAgIH0pLnRoZW4oKGRlbGV0ZWQpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGRlbGV0ZWQpO1xuICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGluaXQoKSB7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICBpZih1cmwuc2VhcmNoUGFyYW1zLmdldChcInJhd1wiKSAhPT0gdW5kZWZpbmVkICYmXG4gICAgIHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwicmF3XCIpICE9PSBudWxsKSB7XG4gICAgZGlzcGxheVNlc3Npb25zKHRydWUpO1xuICB9IGVsc2UgaWYodXJsLnNlYXJjaFBhcmFtcy5nZXQoXCJzdW1tYXJ5XCIpICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwic3VtbWFyeVwiKSAhPT0gbnVsbCkge1xuICAgIGRpc3BsYXlTdW1tYXJ5KCk7XG4gIH0gZWxzZSBpZih1cmwuc2VhcmNoUGFyYW1zLmdldChcImNsZWFyXCIpICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIHVybC5zZWFyY2hQYXJhbXMuZ2V0KFwiY2xlYXJcIikgIT09IG51bGwpIHtcbiAgICBjbGVhclNlc3Npb25zKCk7XG4gIH0gZWxzZSB7XG4gICAgZGlzcGxheVNlc3Npb25zKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGlzcGxheVNlc3Npb25zKHJhdzogYm9vbGVhbiA9IGZhbHNlKSB7XG4gIGNvbnN0IGNsaWVudFByb21pc2UgPSBzdGl0Y2guU3RpdGNoQ2xpZW50RmFjdG9yeS5jcmVhdGUoXCJnb3QteXlnZ2RcIik7XG4gIGNsaWVudFByb21pc2UudGhlbigoY2xpZW50KSA9PiB7XG5cbiAgICBjbGllbnQubG9naW4oKS50aGVuKCgpID0+IHtcblxuICAgICAgY29uc3QgZGIgPSBjbGllbnQuc2VydmljZShcIm1vbmdvZGJcIiwgXCJtb25nb2RiLWF0bGFzXCIpLmRiKFwiZ290XCIpO1xuICAgICAgY29uc3Qgc2Vzc2lvbnMgPSBkYi5jb2xsZWN0aW9uKFwic2Vzc2lvbnNcIik7XG5cbiAgICAgIHNlc3Npb25zLmZpbmQoe30pLmxpbWl0KDEwMDApLmV4ZWN1dGUoKS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgaWYocmF3KSB7XG4gICAgICAgICAgZGlzcGxheURhdGFSYXcocmVzdWx0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkaXNwbGF5RGF0YShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIH0pO1xuICB9KTtcbiAgICAgIC8qY2xpZW50LmV4ZWN1dGVQaXBlbGluZSh7XG4gICAgICAgIHNlcnZpY2U6IFwibW9uZ29kYi1hdGxhc1wiLFxuICAgICAgICBhY3Rpb246IFwiYWdncmVnYXRlXCIsXG4gICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICBkYXRhYmFzZTogXCJnb3RcIixcbiAgICAgICAgICBjb2xsZWN0aW9uOiBcInNlc3Npb25zXCIsXG4gICAgICAgICAgcGlwZWxpbmU6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgJGdyb3VwOiB7XG4gICAgICAgICAgICAgICAgX2lkOiB7XG4gICAgICAgICAgICAgICAgICBuYW1lOiBcIiRuYW1lXCIsXG4gICAgICAgICAgICAgICAgICBvc19mYW1pbHk6IFwiJG9zX2ZhbWlseVwiLFxuICAgICAgICAgICAgICAgICAgdmVyc2lvbjogXCIkdmVyc2lvblwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY291bnQ6IHtcbiAgICAgICAgICAgICAgICAgICRzdW06IDEsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBydW5fdGltZV9hdmVyYWdlOiB7XG4gICAgICAgICAgICAgICAgICAkYXZnOiBcIiRydW5fdGltZVwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnBzX2ZyYW1lX2F2ZXJhZ2U6IHtcbiAgICAgICAgICAgICAgICAgICRhdmc6IFwiJGZwc19mcmFtZVwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnBzX2ZyYW1lX3N0ZERldlBvcDoge1xuICAgICAgICAgICAgICAgICAgJHN0ZERldlBvcDogXCIkZnBzX2ZyYW1lXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmcHNfZnJhbWVfc3RkRGV2U2FtcDoge1xuICAgICAgICAgICAgICAgICAgJHN0ZERldlNhbXA6IFwiJGZwc19mcmFtZVwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnBzX2xvbmdfYXZlcmFnZToge1xuICAgICAgICAgICAgICAgICAgJGF2ZzogXCIkZnBzX2xvbmdcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZwc19sb25nX3N0ZERldlBvcDoge1xuICAgICAgICAgICAgICAgICAgJHN0ZERldlBvcDogXCIkZnBzX2xvbmdcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZwc19sb25nX3N0ZERldlNhbXA6IHtcbiAgICAgICAgICAgICAgICAgICRzdGREZXZTYW1wOiBcIiRmcHNfbG9uZ1wiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9LCB7XG4gICAgICAgIGFsbG93RGlza1VzZTogdHJ1ZSxcbiAgICAgIH0pXG4gICAgICAgIC50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcInN1Y2Nlc3M6IFwiLCByZXN1bHQpO1xuICAgICAgICAgIGRpc3BsYXlEYXRhKHJlc3VsdCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3I6IFwiLCBlKTtcbiAgICAgICAgfSk7Ki9cbn1cblxuZnVuY3Rpb24gZGlzcGxheVN1bW1hcnkoKSB7XG4gIGNvbnN0IGNsaWVudFByb21pc2UgPSBzdGl0Y2guU3RpdGNoQ2xpZW50RmFjdG9yeS5jcmVhdGUoXCJnb3QteXlnZ2RcIik7XG4gIGNsaWVudFByb21pc2UudGhlbigoY2xpZW50KSA9PiB7XG5cbiAgICBjbGllbnQubG9naW4oKS50aGVuKCgpID0+IHtcblxuICAgICAgY29uc3QgZGIgPSBjbGllbnQuc2VydmljZShcIm1vbmdvZGJcIiwgXCJtb25nb2RiLWF0bGFzXCIpLmRiKFwiZ290XCIpO1xuICAgICAgY29uc3Qgc2Vzc2lvbnMgPSBkYi5jb2xsZWN0aW9uKFwic2Vzc2lvbnNcIik7XG5cbiAgICAgIHNlc3Npb25zLmFnZ3JlZ2F0ZShbXG4gICAgICAgIHskbWF0Y2g6IHtjbGVhblNodXRkb3duOiB0cnVlfX0sXG4gICAgICAgIHskZ3JvdXA6IHtfaWQ6IFwiJGRlc2NyaXB0aW9uXCIsXG4gICAgICAgICAgICAgICAgICBjb3VudDogeyRzdW06IDF9LFxuICAgICAgICAgICAgICAgICAgc3RhcnR1cER1cmF0aW9uQXZlcmFnZTogeyRhdmc6IFwiJHN0YXJ0dXBEdXJhdGlvblwifSxcbiAgICAgICAgICAgICAgICAgIGZwc0F2ZXJhZ2VBdmVyYWdlOiB7JGF2ZzogXCIkZnBzQXZlcmFnZVwifSxcbiAgICAgICAgICAgICAgICAgIHJ1bkR1cmF0aW9uQXZlcmFnZTogeyRhdmc6IFwiJHJ1bkR1cmF0aW9uXCJ9LFxuICAgICAgICB9fVxuICAgICAgXSkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdCk7XG4gICAgICAgIGRpc3BsYXlEYXRhUmF3KHJlc3VsdCk7XG4gICAgICB9KTtcblxuICAgIH0pO1xuICB9KTtcbn1cblxuaW50ZXJmYWNlIElTdGF0RmllbGRMYWJlbCB7XG4gIGdyb3VwOiBzdHJpbmc7XG4gIGtleTogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICB2aXNpYmxlPzogYm9vbGVhbjtcbiAgcmVxdWlyZWQ/OiBib29sZWFuO1xufVxuXG5jb25zdCBoZWFkaW5nczogSVN0YXRGaWVsZExhYmVsW10gPSBbXG4gIHtcbiAgICBncm91cDogXCJicm93c2VyXCIsXG4gICAga2V5OiBcIm5hbWVcIixcbiAgICBkZXNjcmlwdGlvbjogXCJuYW1lXCIsXG4gIH0sXG4gIHtcbiAgICBncm91cDogXCJicm93c2VyXCIsXG4gICAga2V5OiBcIm1hbnVmYWN0dXJlclwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIm1hbnVmYWN0dXJlclwiLFxuICB9LFxuICB7XG4gICAgZ3JvdXA6IFwiYnJvd3NlclwiLFxuICAgIGtleTogXCJsYXlvdXRcIixcbiAgICBkZXNjcmlwdGlvbjogXCJsYXlvdXRcIixcbiAgfSxcbiAge1xuICAgIGdyb3VwOiBcImJyb3dzZXJcIixcbiAgICBrZXk6IFwiZGVzY3JpcHRpb25cIixcbiAgICBkZXNjcmlwdGlvbjogXCJCcm93c2VyXCIsXG4gICAgdmlzaWJsZTogdHJ1ZSxcbiAgfSxcbiAge1xuICAgIGdyb3VwOiBcImJyb3dzZXJcIixcbiAgICBrZXk6IFwidmVyc2lvblwiLFxuICAgIGRlc2NyaXB0aW9uOiBcInZlcnNpb25cIixcbiAgfSxcbiAge1xuICAgIGdyb3VwOiBcImJyb3dzZXJcIixcbiAgICBrZXk6IFwib3NfYXJjaGl0ZWN0dXJlXCIsXG4gICAgZGVzY3JpcHRpb246IFwiT1MgYXJjaGl0ZWN0dXJlXCIsXG4gIH0sXG4gIHtcbiAgICBncm91cDogXCJicm93c2VyXCIsXG4gICAga2V5OiBcIm9zX2ZhbWlseVwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIk9TXCIsXG4gIH0sXG4gIHtcbiAgICBncm91cDogXCJicm93c2VyXCIsXG4gICAga2V5OiBcIm9zX3ZlcnNpb25cIixcbiAgICBkZXNjcmlwdGlvbjogXCJPUyB2ZXJzaW9uXCIsXG4gIH0sXG4gIHtcbiAgICBncm91cDogXCJicm93c2VyXCIsXG4gICAga2V5OiBcImhhcmR3YXJlQ29uY3VycmVuY3lcIixcbiAgICBkZXNjcmlwdGlvbjogXCJhdmFpbGFibGUgY29yZXMgKFRPRE8pXCIsXG4gIH0sXG4gIHtcbiAgICBncm91cDogXCJicm93c2VyXCIsXG4gICAga2V5OiBcIndvcmtlclR5cGVcIixcbiAgICBkZXNjcmlwdGlvbjogXCJXZWIgd29ya2VyIHR5cGVcIixcbiAgfSxcbiAge1xuICAgIGdyb3VwOiBcInNlc3Npb25cIixcbiAgICBrZXk6IFwic3RhcnRUaW1lXCIsXG4gICAgZGVzY3JpcHRpb246IFwiXCIsXG4gICAgdmlzaWJsZTogdHJ1ZSxcbiAgICByZXF1aXJlZDogdHJ1ZSxcbiAgfSxcbiAge1xuICAgIGdyb3VwOiBcInNlc3Npb25cIixcbiAgICBrZXk6IFwic2Vzc2lvbklkXCIsXG4gICAgZGVzY3JpcHRpb246IFwiXCIsXG4gIH0sXG4gIHtcbiAgICBncm91cDogXCJzZXNzaW9uXCIsXG4gICAga2V5OiBcInN0YXJ0dXBEdXJhdGlvblwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlwiLFxuICAgIHZpc2libGU6IHRydWUsXG4gIH0sXG4gIHtcbiAgICBncm91cDogXCJzZXNzaW9uXCIsXG4gICAga2V5OiBcImZwc0ZyYW1lXCIsXG4gICAgZGVzY3JpcHRpb246IFwiXCIsXG4gIH0sXG4gIHtcbiAgICBncm91cDogXCJzZXNzaW9uXCIsXG4gICAga2V5OiBcImZwc0F2ZXJhZ2VcIixcbiAgICBkZXNjcmlwdGlvbjogXCJcIixcbiAgICB2aXNpYmxlOiB0cnVlLFxuICB9LFxuICB7XG4gICAgZ3JvdXA6IFwic2Vzc2lvblwiLFxuICAgIGtleTogXCJmcHNMb25nXCIsXG4gICAgZGVzY3JpcHRpb246IFwiXCIsXG4gICAgdmlzaWJsZTogdHJ1ZSxcbiAgfSxcbiAge1xuICAgIGdyb3VwOiBcInNlc3Npb25cIixcbiAgICBrZXk6IFwicnVuRHVyYXRpb25cIixcbiAgICBkZXNjcmlwdGlvbjogXCJcIixcbiAgICB2aXNpYmxlOiB0cnVlLFxuICB9LFxuICB7XG4gICAgZ3JvdXA6IFwic2Vzc2lvblwiLFxuICAgIGtleTogXCJzdGF0ZVwiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlwiLFxuICB9LFxuICB7XG4gICAgZ3JvdXA6IFwic2Vzc2lvblwiLFxuICAgIGtleTogXCJjbGVhblNodXRkb3duXCIsXG4gICAgZGVzY3JpcHRpb246IFwiVXNlciByZXR1cm5lZC5cIixcbiAgICB2aXNpYmxlOiB0cnVlLFxuICB9LFxuXTtcblxuZnVuY3Rpb24gZGlzcGxheURhdGEoZGF0YSkge1xuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGF0c1wiKTtcbiAgY29uc3QgdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGFibGVcIik7XG4gIGNvbnN0IHRhYmxlQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0Ym9keVwiKTtcblxuICBjb25zdCB0YWJsZUhlYWRSb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidHJcIik7XG4gIGhlYWRpbmdzLmZvckVhY2goKGhlYWRpbmc6IElTdGF0RmllbGRMYWJlbCkgPT4ge1xuICAgIGlmKGhlYWRpbmcudmlzaWJsZSkge1xuICAgICAgY29uc3Qga2V5ID0gaGVhZGluZy5rZXk7XG4gICAgICBjb25zdCB0YWJsZUhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0aFwiKTtcbiAgICAgIGlmKGhlYWRpbmcuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgdGFibGVIZWFkZXIuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoaGVhZGluZy5kZXNjcmlwdGlvbikpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGFibGVIZWFkZXIuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoa2V5KSk7XG4gICAgICB9XG4gICAgICB0YWJsZUhlYWRSb3cuYXBwZW5kQ2hpbGQodGFibGVIZWFkZXIpO1xuICAgIH1cbiAgfSk7XG4gIHRhYmxlQm9keS5hcHBlbmRDaGlsZCh0YWJsZUhlYWRSb3cpO1xuXG4gIGRhdGEuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgIGNvbnN0IHRhYmxlUm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRyXCIpO1xuICAgIGNvbnN0IG1pc3NpbmdGaWVsZHMgPSBbXTtcbiAgICBoZWFkaW5ncy5mb3JFYWNoKChoZWFkaW5nOiBJU3RhdEZpZWxkTGFiZWwpID0+IHtcbiAgICAgIGNvbnN0IGtleSA9IGhlYWRpbmcua2V5O1xuICAgICAgaWYoaGVhZGluZy5yZXF1aXJlZCAmJiAhaXRlbVtrZXldKSB7XG4gICAgICAgIG1pc3NpbmdGaWVsZHMucHVzaChrZXkpO1xuICAgICAgfVxuICAgICAgaWYoaGVhZGluZy52aXNpYmxlKSB7XG4gICAgICAgIGNvbnN0IHRhYmxlRGF0YSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZFwiKTtcbiAgICAgICAgdGFibGVEYXRhLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGl0ZW1ba2V5XSkpO1xuICAgICAgICB0YWJsZVJvdy5hcHBlbmRDaGlsZCh0YWJsZURhdGEpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmKG1pc3NpbmdGaWVsZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0YWJsZUJvZHkuYXBwZW5kQ2hpbGQodGFibGVSb3cpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJNaXNzaW5nIGRhdGEgaW4gZGIgZm9yIGZpZWxkczpcIiwgbWlzc2luZ0ZpZWxkcywgaXRlbSk7XG4gICAgfVxuICB9KTtcbiAgdGFibGUuYXBwZW5kQ2hpbGQodGFibGVCb2R5KTtcbiAgZWxlbWVudC5pbm5lckhUTUwgPSBcIlwiO1xuICBlbGVtZW50LmFwcGVuZENoaWxkKHRhYmxlKTtcbn1cblxuZnVuY3Rpb24gZGlzcGxheURhdGFSYXcoZGF0YSkge1xuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGF0c1wiKTtcbiAgZWxlbWVudC5pbm5lckhUTUwgPSBzeW50YXhIaWdobGlnaHQoZGF0YSk7XG59XG5cbi8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzQ4MTA4NDEvaG93LWNhbi1pLXByZXR0eS1wcmludC1qc29uLXVzaW5nLWphdmFzY3JpcHRcbmZ1bmN0aW9uIHN5bnRheEhpZ2hsaWdodChqc29uKSB7XG4gIGlmICh0eXBlb2YganNvbiAhPT0gXCJzdHJpbmdcIikge1xuICAgIGpzb24gPSBKU09OLnN0cmluZ2lmeShqc29uLCB1bmRlZmluZWQsIDIpO1xuICB9XG4gIGpzb24gPSBqc29uLnJlcGxhY2UoLyYvZywgXCImYW1wO1wiKVxuICAgIC5yZXBsYWNlKC88L2csIFwiJmx0O1wiKS5yZXBsYWNlKC8+L2csIFwiJmd0O1wiKTtcbiAgcmV0dXJuIGpzb24ucmVwbGFjZSgvKFwiKFxcXFx1W2EtekEtWjAtOV17NH18XFxcXFtedV18W15cXFxcXCJdKSpcIihcXHMqOik/fFxcYih0cnVlfGZhbHNlfG51bGwpXFxifC0/XFxkKyg/OlxcLlxcZCopPyg/OltlRV1bK1xcLV0/XFxkKyk/KS9nLCAobWF0Y2gpID0+IHtcbiAgICBsZXQgY2xzID0gXCJudW1iZXJcIjtcbiAgICBpZiAoL15cIi8udGVzdChtYXRjaCkpIHtcbiAgICAgIGlmICgvOiQvLnRlc3QobWF0Y2gpKSB7XG4gICAgICAgIGNscyA9IFwia2V5XCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjbHMgPSBcInN0cmluZ1wiO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoL3RydWV8ZmFsc2UvLnRlc3QobWF0Y2gpKSB7XG4gICAgICBjbHMgPSBcImJvb2xlYW5cIjtcbiAgICB9IGVsc2UgaWYgKC9udWxsLy50ZXN0KG1hdGNoKSkge1xuICAgICAgY2xzID0gXCJudWxsXCI7XG4gICAgfVxuICAgIHJldHVybiBcIjxzcGFuIGNsYXNzPVxcXCJcIiArIGNscyArIFwiXFxcIj5cIiArIG1hdGNoICsgXCI8L3NwYW4+XCI7XG4gIH0pO1xufVxuXG53aW5kb3cub25sb2FkID0gKCkgPT4ge1xuICBpbml0KCk7XG59O1xuXG4iXX0=
