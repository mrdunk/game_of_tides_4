(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright 2017 duncan law (mrdunk@gmail.com)
let db;
function clearSessions() {
    const clientPromise = stitch.StitchClientFactory.create('got-yyggd');
    clientPromise.then(client => {
        const db = client.service('mongodb', 'mongodb-atlas').db('got');
        client.login().then(() => {
            console.log("authenticated");
            console.log(client.authedId(), client.userProfile());
            client.login().then(() => db.collection('sessions').deleteMany({})).then((docs) => {
                console.log(docs);
            }).catch(err => {
                console.error(err);
            });
        });
    });
}
function init() {
    const clientPromise = stitch.StitchClientFactory.create("got-yyggd");
    clientPromise.then((client) => {
        if (window.location.hash.substr(1) === "login") {
            client.authenticate("google");
        }
        if (client.isAuthenticated()) {
            client.userProfile().then(userData => {
                if (userData.data.email) {
                    console.log("authenticated");
                    console.log(userData.data);
                    clearSessions();
                    // db.collection('sessions').deleteMany({});
                }
            });
        }
        db = client.service("mongodb", "mongodb-atlas").db("got");
        const sessions = db.collection("sessions");
        console.log(sessions);
        sessions.count().then((val) => {
            console.log(val);
        });
        sessions.find({}).limit(100).execute().then((result) => {
            console.log("success: ", result);
            displayData(result);
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
    });
}
function displayData(data) {
    const keys = {};
    data.forEach((item) => {
        for (let key in item) {
            keys[key] = true;
        }
    });
    console.log(keys);
    const headings = [
        {
            group: "browser",
            key: "name",
            description: "name",
        },
        {
            group: "browser",
            key: "manufacturer",
            description: "manufacturer"
        },
        {
            group: "browser",
            key: "layout",
            description: "layout"
        },
        {
            group: "browser",
            key: "description",
            description: "Browser",
            visible: true
        },
        {
            group: "browser",
            key: "version",
            description: "version"
        },
        {
            group: "browser",
            key: "os_architecture",
            description: "OS architecture"
        },
        {
            group: "browser",
            key: "os_family",
            description: "OS"
        },
        {
            group: "browser",
            key: "os_version",
            description: "OS version"
        },
        {
            group: "browser",
            key: "hardwareConcurrency",
            description: "available cores (TODO)"
        },
        {
            group: "browser",
            key: "workerType",
            description: "Web worker type"
        },
        {
            group: "session",
            key: "startTime",
            description: "",
            visible: true
        },
        {
            group: "session",
            key: "sessionId",
            description: ""
        },
        {
            group: "session",
            key: "startupDuration",
            description: "",
            visible: true
        },
        {
            group: "session",
            key: "fpsFrame",
            description: ""
        },
        {
            group: "session",
            key: "fpsAverage",
            description: "",
            visible: true
        },
        {
            group: "session",
            key: "fpsLong",
            description: "",
            visible: true
        },
        {
            group: "session",
            key: "runDuration",
            description: "",
            visible: true
        },
        {
            group: "session",
            key: "state",
            description: "",
        },
        {
            group: "session",
            key: "cleanShutdown",
            description: "Returning user.",
            visible: true
        },
    ];
    const element = document.getElementById("stats");
    const table = document.createElement("table");
    const tableBody = document.createElement("tbody");
    const tableRow = document.createElement("tr");
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
            tableRow.appendChild(tableHeader);
        }
    });
    tableBody.appendChild(tableRow);
    data.forEach((item) => {
        const tableRow = document.createElement("tr");
        headings.forEach((heading) => {
            if (heading.visible) {
                const key = heading.key;
                const tableData = document.createElement("td");
                tableData.appendChild(document.createTextNode(item[key]));
                tableRow.appendChild(tableData);
            }
        });
        tableBody.appendChild(tableRow);
    });
    table.appendChild(tableBody);
    element.appendChild(table);
    /* const element = document.getElementById("stats");
    element.innerHTML = syntaxHighlight(data); */
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc3RhdHMvc3RhdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSwrQ0FBK0M7QUFHL0MsSUFBSSxFQUFFLENBQUM7QUFFUDtJQUNFLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDckUsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNO1FBQ3ZCLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoRSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBSSxDQUFDO1lBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDN0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDckQsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQyxNQUNsQixFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FDekMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJO2dCQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDbkIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUc7Z0JBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUNwQixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQ7SUFDRSxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lB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LE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyx3R0FBd0csRUFBRSxDQUFDLEtBQUs7UUFDbEksSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDO1FBQ25CLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyQixHQUFHLEdBQUcsS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLEdBQUcsR0FBRyxRQUFRLENBQUM7WUFDakIsQ0FBQztRQUNILENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEMsR0FBRyxHQUFHLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlCLEdBQUcsR0FBRyxNQUFNLENBQUM7UUFDZixDQUFDO1FBQ0QsTUFBTSxDQUFDLGdCQUFnQixHQUFHLEdBQUcsR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLFNBQVMsQ0FBQztJQUM1RCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxNQUFNLENBQUMsTUFBTSxHQUFHO0lBQ2QsSUFBSSxFQUFFLENBQUM7QUFDVCxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQ29weXJpZ2h0IDIwMTcgZHVuY2FuIGxhdyAobXJkdW5rQGdtYWlsLmNvbSlcblxuZGVjbGFyZSB2YXIgc3RpdGNoO1xubGV0IGRiO1xuXG5mdW5jdGlvbiBjbGVhclNlc3Npb25zKCkge1xuICBjb25zdCBjbGllbnRQcm9taXNlID0gc3RpdGNoLlN0aXRjaENsaWVudEZhY3RvcnkuY3JlYXRlKCdnb3QteXlnZ2QnKTtcbiAgY2xpZW50UHJvbWlzZS50aGVuKGNsaWVudCA9PiB7XG4gICAgY29uc3QgZGIgPSBjbGllbnQuc2VydmljZSgnbW9uZ29kYicsICdtb25nb2RiLWF0bGFzJykuZGIoJ2dvdCcpO1xuICAgIGNsaWVudC5sb2dpbigpLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coXCJhdXRoZW50aWNhdGVkXCIpO1xuICAgICAgY29uc29sZS5sb2coY2xpZW50LmF1dGhlZElkKCksIGNsaWVudC51c2VyUHJvZmlsZSgpKTtcbiAgICAgIGNsaWVudC5sb2dpbigpLnRoZW4oKCkgPT5cbiAgICAgICAgZGIuY29sbGVjdGlvbignc2Vzc2lvbnMnKS5kZWxldGVNYW55KHt9KVxuICAgICAgKS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRvY3MpXG4gICAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gaW5pdCgpIHtcbiAgY29uc3QgY2xpZW50UHJvbWlzZSA9IHN0aXRjaC5TdGl0Y2hDbGllbnRGYWN0b3J5LmNyZWF0ZShcImdvdC15eWdnZFwiKTtcbiAgY2xpZW50UHJvbWlzZS50aGVuKChjbGllbnQpID0+IHtcblxuXHRcdGlmKHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cigxKSA9PT0gXCJsb2dpblwiKSB7XG5cdFx0XHRjbGllbnQuYXV0aGVudGljYXRlKFwiZ29vZ2xlXCIpO1xuXHRcdH1cblxuICAgIGlmKGNsaWVudC5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgY2xpZW50LnVzZXJQcm9maWxlKCkudGhlbih1c2VyRGF0YT0+e1xuICAgICAgICBpZih1c2VyRGF0YS5kYXRhLmVtYWlsKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJhdXRoZW50aWNhdGVkXCIpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKHVzZXJEYXRhLmRhdGEpO1xuICAgICAgICAgIGNsZWFyU2Vzc2lvbnMoKTtcbiAgICAgICAgICAvLyBkYi5jb2xsZWN0aW9uKCdzZXNzaW9ucycpLmRlbGV0ZU1hbnkoe30pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBkYiA9IGNsaWVudC5zZXJ2aWNlKFwibW9uZ29kYlwiLCBcIm1vbmdvZGItYXRsYXNcIikuZGIoXCJnb3RcIik7XG4gICAgY29uc3Qgc2Vzc2lvbnMgPSBkYi5jb2xsZWN0aW9uKFwic2Vzc2lvbnNcIik7XG4gICAgY29uc29sZS5sb2coc2Vzc2lvbnMpO1xuICAgIHNlc3Npb25zLmNvdW50KCkudGhlbigodmFsKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyh2YWwpO1xuICAgIH0pO1xuICAgIHNlc3Npb25zLmZpbmQoe30pLmxpbWl0KDEwMCkuZXhlY3V0ZSgpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coXCJzdWNjZXNzOiBcIiwgcmVzdWx0KTtcbiAgICAgIGRpc3BsYXlEYXRhKHJlc3VsdCk7XG4gICAgfSk7XG4gICAgICAvKmNsaWVudC5leGVjdXRlUGlwZWxpbmUoe1xuICAgICAgICBzZXJ2aWNlOiBcIm1vbmdvZGItYXRsYXNcIixcbiAgICAgICAgYWN0aW9uOiBcImFnZ3JlZ2F0ZVwiLFxuICAgICAgICBhcmdzOiB7XG4gICAgICAgICAgZGF0YWJhc2U6IFwiZ290XCIsXG4gICAgICAgICAgY29sbGVjdGlvbjogXCJzZXNzaW9uc1wiLFxuICAgICAgICAgIHBpcGVsaW5lOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICRncm91cDoge1xuICAgICAgICAgICAgICAgIF9pZDoge1xuICAgICAgICAgICAgICAgICAgbmFtZTogXCIkbmFtZVwiLFxuICAgICAgICAgICAgICAgICAgb3NfZmFtaWx5OiBcIiRvc19mYW1pbHlcIixcbiAgICAgICAgICAgICAgICAgIHZlcnNpb246IFwiJHZlcnNpb25cIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNvdW50OiB7XG4gICAgICAgICAgICAgICAgICAkc3VtOiAxLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcnVuX3RpbWVfYXZlcmFnZToge1xuICAgICAgICAgICAgICAgICAgJGF2ZzogXCIkcnVuX3RpbWVcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZwc19mcmFtZV9hdmVyYWdlOiB7XG4gICAgICAgICAgICAgICAgICAkYXZnOiBcIiRmcHNfZnJhbWVcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZwc19mcmFtZV9zdGREZXZQb3A6IHtcbiAgICAgICAgICAgICAgICAgICRzdGREZXZQb3A6IFwiJGZwc19mcmFtZVwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnBzX2ZyYW1lX3N0ZERldlNhbXA6IHtcbiAgICAgICAgICAgICAgICAgICRzdGREZXZTYW1wOiBcIiRmcHNfZnJhbWVcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZwc19sb25nX2F2ZXJhZ2U6IHtcbiAgICAgICAgICAgICAgICAgICRhdmc6IFwiJGZwc19sb25nXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmcHNfbG9uZ19zdGREZXZQb3A6IHtcbiAgICAgICAgICAgICAgICAgICRzdGREZXZQb3A6IFwiJGZwc19sb25nXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmcHNfbG9uZ19zdGREZXZTYW1wOiB7XG4gICAgICAgICAgICAgICAgICAkc3RkRGV2U2FtcDogXCIkZnBzX2xvbmdcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSwge1xuICAgICAgICBhbGxvd0Rpc2tVc2U6IHRydWUsXG4gICAgICB9KVxuICAgICAgICAudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJzdWNjZXNzOiBcIiwgcmVzdWx0KTtcbiAgICAgICAgICBkaXNwbGF5RGF0YShyZXN1bHQpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yOiBcIiwgZSk7XG4gICAgICAgIH0pOyovXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBkaXNwbGF5RGF0YShkYXRhKSB7XG4gIGNvbnN0IGtleXMgPSB7fTtcbiAgZGF0YS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgZm9yKGxldCBrZXkgaW4gaXRlbSkge1xuICAgICAga2V5c1trZXldID0gdHJ1ZTtcbiAgICB9XG4gIH0pO1xuICBjb25zb2xlLmxvZyhrZXlzKTtcblxuICBjb25zdCBoZWFkaW5ncyA9IFtcbiAgICB7XG4gICAgICBncm91cDogXCJicm93c2VyXCIsXG4gICAgICBrZXk6IFwibmFtZVwiLFxuICAgICAgZGVzY3JpcHRpb246IFwibmFtZVwiLFxuICAgIH0sXG4gICAge1xuICAgICAgZ3JvdXA6IFwiYnJvd3NlclwiLFxuICAgICAga2V5OiBcIm1hbnVmYWN0dXJlclwiLFxuICAgICAgZGVzY3JpcHRpb246IFwibWFudWZhY3R1cmVyXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIGdyb3VwOiBcImJyb3dzZXJcIixcbiAgICAgIGtleTogXCJsYXlvdXRcIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcImxheW91dFwiXG4gICAgfSxcbiAgICB7XG4gICAgICBncm91cDogXCJicm93c2VyXCIsXG4gICAgICBrZXk6IFwiZGVzY3JpcHRpb25cIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkJyb3dzZXJcIixcbiAgICAgIHZpc2libGU6IHRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgIGdyb3VwOiBcImJyb3dzZXJcIixcbiAgICAgIGtleTogXCJ2ZXJzaW9uXCIsXG4gICAgICBkZXNjcmlwdGlvbjogXCJ2ZXJzaW9uXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIGdyb3VwOiBcImJyb3dzZXJcIixcbiAgICAgIGtleTogXCJvc19hcmNoaXRlY3R1cmVcIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcIk9TIGFyY2hpdGVjdHVyZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBncm91cDogXCJicm93c2VyXCIsXG4gICAgICBrZXk6IFwib3NfZmFtaWx5XCIsXG4gICAgICBkZXNjcmlwdGlvbjogXCJPU1wiXG4gICAgfSxcbiAgICB7XG4gICAgICBncm91cDogXCJicm93c2VyXCIsXG4gICAgICBrZXk6IFwib3NfdmVyc2lvblwiLFxuICAgICAgZGVzY3JpcHRpb246IFwiT1MgdmVyc2lvblwiXG4gICAgfSxcbiAgICB7XG4gICAgICBncm91cDogXCJicm93c2VyXCIsXG4gICAgICBrZXk6IFwiaGFyZHdhcmVDb25jdXJyZW5jeVwiLFxuICAgICAgZGVzY3JpcHRpb246IFwiYXZhaWxhYmxlIGNvcmVzIChUT0RPKVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBncm91cDogXCJicm93c2VyXCIsXG4gICAgICBrZXk6IFwid29ya2VyVHlwZVwiLFxuICAgICAgZGVzY3JpcHRpb246IFwiV2ViIHdvcmtlciB0eXBlXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIGdyb3VwOiBcInNlc3Npb25cIixcbiAgICAgIGtleTogXCJzdGFydFRpbWVcIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlwiLFxuICAgICAgdmlzaWJsZTogdHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgZ3JvdXA6IFwic2Vzc2lvblwiLFxuICAgICAga2V5OiBcInNlc3Npb25JZFwiLFxuICAgICAgZGVzY3JpcHRpb246IFwiXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIGdyb3VwOiBcInNlc3Npb25cIixcbiAgICAgIGtleTogXCJzdGFydHVwRHVyYXRpb25cIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlwiLFxuICAgICAgdmlzaWJsZTogdHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgZ3JvdXA6IFwic2Vzc2lvblwiLFxuICAgICAga2V5OiBcImZwc0ZyYW1lXCIsXG4gICAgICBkZXNjcmlwdGlvbjogXCJcIlxuICAgIH0sXG4gICAge1xuICAgICAgZ3JvdXA6IFwic2Vzc2lvblwiLFxuICAgICAga2V5OiBcImZwc0F2ZXJhZ2VcIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlwiLFxuICAgICAgdmlzaWJsZTogdHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgZ3JvdXA6IFwic2Vzc2lvblwiLFxuICAgICAga2V5OiBcImZwc0xvbmdcIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlwiLFxuICAgICAgdmlzaWJsZTogdHJ1ZVxuICAgIH0sXG4gICAge1xuICAgICAgZ3JvdXA6IFwic2Vzc2lvblwiLFxuICAgICAga2V5OiBcInJ1bkR1cmF0aW9uXCIsXG4gICAgICBkZXNjcmlwdGlvbjogXCJcIixcbiAgICAgIHZpc2libGU6IHRydWVcbiAgICB9LFxuICAgIHtcbiAgICAgIGdyb3VwOiBcInNlc3Npb25cIixcbiAgICAgIGtleTogXCJzdGF0ZVwiLFxuICAgICAgZGVzY3JpcHRpb246IFwiXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICBncm91cDogXCJzZXNzaW9uXCIsXG4gICAgICBrZXk6IFwiY2xlYW5TaHV0ZG93blwiLFxuICAgICAgZGVzY3JpcHRpb246IFwiUmV0dXJuaW5nIHVzZXIuXCIsXG4gICAgICB2aXNpYmxlOiB0cnVlXG4gICAgfSxcbiAgXTtcblxuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGF0c1wiKTtcbiAgY29uc3QgdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGFibGVcIik7XG4gIGNvbnN0IHRhYmxlQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0Ym9keVwiKTtcblxuICBjb25zdCB0YWJsZVJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0clwiKTtcbiAgaGVhZGluZ3MuZm9yRWFjaCgoaGVhZGluZykgPT4ge1xuICAgIGlmKGhlYWRpbmcudmlzaWJsZSkge1xuICAgICAgY29uc3Qga2V5ID0gaGVhZGluZy5rZXk7XG4gICAgICBjb25zdCB0YWJsZUhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0aFwiKTtcbiAgICAgIGlmKGhlYWRpbmcuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgdGFibGVIZWFkZXIuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoaGVhZGluZy5kZXNjcmlwdGlvbikpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YWJsZUhlYWRlci5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShrZXkpKVxuICAgICAgfVxuICAgICAgdGFibGVSb3cuYXBwZW5kQ2hpbGQodGFibGVIZWFkZXIpO1xuICAgIH1cbiAgfSk7XG4gIHRhYmxlQm9keS5hcHBlbmRDaGlsZCh0YWJsZVJvdyk7XG5cbiAgZGF0YS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgY29uc3QgdGFibGVSb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidHJcIik7XG4gICAgaGVhZGluZ3MuZm9yRWFjaCgoaGVhZGluZykgPT4ge1xuICAgICAgaWYoaGVhZGluZy52aXNpYmxlKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGhlYWRpbmcua2V5O1xuICAgICAgICBjb25zdCB0YWJsZURhdGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGRcIik7XG4gICAgICAgIHRhYmxlRGF0YS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShpdGVtW2tleV0pKVxuICAgICAgICB0YWJsZVJvdy5hcHBlbmRDaGlsZCh0YWJsZURhdGEpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRhYmxlQm9keS5hcHBlbmRDaGlsZCh0YWJsZVJvdyk7XG4gIH0pO1xuICB0YWJsZS5hcHBlbmRDaGlsZCh0YWJsZUJvZHkpO1xuICBlbGVtZW50LmFwcGVuZENoaWxkKHRhYmxlKTtcblxuICAvKiBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGF0c1wiKTtcbiAgZWxlbWVudC5pbm5lckhUTUwgPSBzeW50YXhIaWdobGlnaHQoZGF0YSk7ICovXG59XG5cbi8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzQ4MTA4NDEvaG93LWNhbi1pLXByZXR0eS1wcmludC1qc29uLXVzaW5nLWphdmFzY3JpcHRcbmZ1bmN0aW9uIHN5bnRheEhpZ2hsaWdodChqc29uKSB7XG4gIGlmICh0eXBlb2YganNvbiAhPT0gXCJzdHJpbmdcIikge1xuICAgIGpzb24gPSBKU09OLnN0cmluZ2lmeShqc29uLCB1bmRlZmluZWQsIDIpO1xuICB9XG4gIGpzb24gPSBqc29uLnJlcGxhY2UoLyYvZywgXCImYW1wO1wiKVxuICAgIC5yZXBsYWNlKC88L2csIFwiJmx0O1wiKS5yZXBsYWNlKC8+L2csIFwiJmd0O1wiKTtcbiAgcmV0dXJuIGpzb24ucmVwbGFjZSgvKFwiKFxcXFx1W2EtekEtWjAtOV17NH18XFxcXFtedV18W15cXFxcXCJdKSpcIihcXHMqOik/fFxcYih0cnVlfGZhbHNlfG51bGwpXFxifC0/XFxkKyg/OlxcLlxcZCopPyg/OltlRV1bK1xcLV0/XFxkKyk/KS9nLCAobWF0Y2gpID0+IHtcbiAgICBsZXQgY2xzID0gXCJudW1iZXJcIjtcbiAgICBpZiAoL15cIi8udGVzdChtYXRjaCkpIHtcbiAgICAgIGlmICgvOiQvLnRlc3QobWF0Y2gpKSB7XG4gICAgICAgIGNscyA9IFwia2V5XCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjbHMgPSBcInN0cmluZ1wiO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoL3RydWV8ZmFsc2UvLnRlc3QobWF0Y2gpKSB7XG4gICAgICBjbHMgPSBcImJvb2xlYW5cIjtcbiAgICB9IGVsc2UgaWYgKC9udWxsLy50ZXN0KG1hdGNoKSkge1xuICAgICAgY2xzID0gXCJudWxsXCI7XG4gICAgfVxuICAgIHJldHVybiBcIjxzcGFuIGNsYXNzPVxcXCJcIiArIGNscyArIFwiXFxcIj5cIiArIG1hdGNoICsgXCI8L3NwYW4+XCI7XG4gIH0pO1xufVxuXG53aW5kb3cub25sb2FkID0gKCkgPT4ge1xuICBpbml0KCk7XG59O1xuXG4iXX0=
