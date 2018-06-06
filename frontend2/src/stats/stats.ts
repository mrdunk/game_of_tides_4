// Copyright 2017 duncan law (mrdunk@gmail.com)

declare var stitch;

function clearSessions() {
  const clientPromise = stitch.StitchClientFactory.create("got-yyggd");
  clientPromise.then((client) => {

    if(window.location.hash.substr(1) === "login") {
      client.authenticate("google", { redirectUrl: "?clear"});
    }

    client.login().then(() => {

      if(!client.isAuthenticated()) {
        console.warn("Not authenticated");
        return;
      }
      client.userProfile().then((userData) => {
        if(!userData.data.email) {
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
  if(url.searchParams.get("raw") !== undefined &&
     url.searchParams.get("raw") !== null) {
    displaySessions(true);
  } else if(url.searchParams.get("summary") !== undefined &&
            url.searchParams.get("summary") !== null) {
    displaySummary();
  } else if(url.searchParams.get("clear") !== undefined &&
            url.searchParams.get("clear") !== null) {
    clearSessions();
  } else {
    displaySessions();
  }
}

function displaySessions(raw: boolean = false) {
  const clientPromise = stitch.StitchClientFactory.create("got-yyggd");
  clientPromise.then((client) => {

    client.login().then(() => {

      const db = client.service("mongodb", "mongodb-atlas").db("got");
      const sessions = db.collection("sessions");

      sessions.find({}).limit(1000).execute().then((result) => {
        if(raw) {
          displayDataRaw(result);
        } else {
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
        {$match: {cleanShutdown: true}},
        {$group: {_id: "$description",
                  count: {$sum: 1},
                  startupDurationAverage: {$avg: "$startupDuration"},
                  fpsAverageAverage: {$avg: "$fpsAverage"},
                  runDurationAverage: {$avg: "$runDuration"},
        }}
      ]).then((result) => {
        console.log(result);
        displayDataRaw(result);
      });

    });
  });
}

interface IStatFieldLabel {
  group: string;
  key: string;
  description: string;
  visible?: boolean;
  required?: boolean;
}

const headings: IStatFieldLabel[] = [
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
  headings.forEach((heading: IStatFieldLabel) => {
    if(heading.visible) {
      const key = heading.key;
      const tableHeader = document.createElement("th");
      if(heading.description) {
        tableHeader.appendChild(document.createTextNode(heading.description));
      } else {
        tableHeader.appendChild(document.createTextNode(key));
      }
      tableHeadRow.appendChild(tableHeader);
    }
  });
  tableBody.appendChild(tableHeadRow);

  data.forEach((item) => {
    const tableRow = document.createElement("tr");
    const missingFields = [];
    headings.forEach((heading: IStatFieldLabel) => {
      const key = heading.key;
      if(heading.required && !item[key]) {
        missingFields.push(key);
      }
      if(heading.visible) {
        const tableData = document.createElement("td");
        tableData.appendChild(document.createTextNode(item[key]));
        tableRow.appendChild(tableData);
      }
    });
    if(missingFields.length === 0) {
      tableBody.appendChild(tableRow);
    } else {
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
      } else {
        cls = "string";
      }
    } else if (/true|false/.test(match)) {
      cls = "boolean";
    } else if (/null/.test(match)) {
      cls = "null";
    }
    return "<span class=\"" + cls + "\">" + match + "</span>";
  });
}

window.onload = () => {
  init();
};

