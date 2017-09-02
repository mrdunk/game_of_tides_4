// Copyright 2017 duncan law (mrdunk@gmail.com)
let client;
let db;
function init() {
    client = new stitch.StitchClient("got-yyggd");
    db = client.service("mongodb", "mongodb-atlas").db("got");
    client.login().then(() => {
        console.log("authenticated");
        const sessions = db.collection("sessions");
        client.executePipeline({
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
        });
    });
}
function displayData(data) {
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
