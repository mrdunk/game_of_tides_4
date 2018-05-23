// Copyright 2017 duncan law (mrdunk@gmail.com)

declare var stitch;
let db;

function clearSessions() {
  const clientPromise = stitch.StitchClientFactory.create('got-yyggd');
  clientPromise.then(client => {
    const db = client.service('mongodb', 'mongodb-atlas').db('got');
    client.login().then(() => {
      console.log("authenticated");
      console.log(client.authedId(), client.userProfile());
      client.login().then(() =>
        db.collection('sessions').deleteMany({})
      ).then((docs) => {
        console.log(docs)
      }).catch(err => {
        console.error(err)
      });
    });
  });
}

function init() {
  const clientPromise = stitch.StitchClientFactory.create("got-yyggd");
  clientPromise.then((client) => {

		if(window.location.hash.substr(1) === "login") {
			client.authenticate("google");
		}

    if(client.isAuthenticated()) {
      client.userProfile().then(userData=>{
        if(userData.data.email) {
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
    for(let key in item) {
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
    if(heading.visible) {
      const key = heading.key;
      const tableHeader = document.createElement("th");
      if(heading.description) {
        tableHeader.appendChild(document.createTextNode(heading.description))
      } else {
        tableHeader.appendChild(document.createTextNode(key))
      }
      tableRow.appendChild(tableHeader);
    }
  });
  tableBody.appendChild(tableRow);

  data.forEach((item) => {
    const tableRow = document.createElement("tr");
    headings.forEach((heading) => {
      if(heading.visible) {
        const key = heading.key;
        const tableData = document.createElement("td");
        tableData.appendChild(document.createTextNode(item[key]))
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

