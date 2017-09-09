(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc3RhdHMvc3RhdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSwrQ0FBK0M7QUFFL0MsSUFBSSxNQUFNLENBQUM7QUFDWCxJQUFJLEVBQUUsQ0FBQztBQUVQO0lBQ0UsTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUM5QyxFQUFFLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFELE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUM7UUFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUM3QixNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzNDLE1BQU0sQ0FBQyxlQUFlLENBQUM7WUFDckIsT0FBTyxFQUFFLGVBQWU7WUFDeEIsTUFBTSxFQUFFLFdBQVc7WUFDbkIsSUFBSSxFQUFFO2dCQUNKLFFBQVEsRUFBRSxLQUFLO2dCQUNmLFVBQVUsRUFBRSxVQUFVO2dCQUN0QixRQUFRLEVBQUU7b0JBQ1I7d0JBQ0UsTUFBTSxFQUFFOzRCQUNOLEdBQUcsRUFBRTtnQ0FDSCxJQUFJLEVBQUUsT0FBTztnQ0FDYixTQUFTLEVBQUUsWUFBWTtnQ0FDdkIsT0FBTyxFQUFFLFVBQVU7NkJBQ3BCOzRCQUNELEtBQUssRUFBRTtnQ0FDTCxJQUFJLEVBQUUsQ0FBQzs2QkFDUjs0QkFDRCxnQkFBZ0IsRUFBRTtnQ0FDaEIsSUFBSSxFQUFFLFdBQVc7NkJBQ2xCOzRCQUNELGlCQUFpQixFQUFFO2dDQUNqQixJQUFJLEVBQUUsWUFBWTs2QkFDbkI7NEJBQ0QsbUJBQW1CLEVBQUU7Z0NBQ25CLFVBQVUsRUFBRSxZQUFZOzZCQUN6Qjs0QkFDRCxvQkFBb0IsRUFBRTtnQ0FDcEIsV0FBVyxFQUFFLFlBQVk7NkJBQzFCOzRCQUNELGdCQUFnQixFQUFFO2dDQUNoQixJQUFJLEVBQUUsV0FBVzs2QkFDbEI7NEJBQ0Qsa0JBQWtCLEVBQUU7Z0NBQ2xCLFVBQVUsRUFBRSxXQUFXOzZCQUN4Qjs0QkFDRCxtQkFBbUIsRUFBRTtnQ0FDbkIsV0FBVyxFQUFFLFdBQVc7NkJBQ3pCO3lCQUNGO3FCQUNGO2lCQUNGO2FBQ0Y7U0FDRixFQUFFO1lBQ0QsWUFBWSxFQUFFLElBQUk7U0FDbkIsQ0FBQzthQUNDLElBQUksQ0FBQyxDQUFDLE1BQU07WUFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNqQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEIsQ0FBQyxDQUFDO2FBQ0QsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNQLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQscUJBQXFCLElBQUk7SUFDdkIsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqRCxPQUFPLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBRUQsMkZBQTJGO0FBQzNGLHlCQUF5QixJQUFJO0lBQzNCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDN0IsSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBQ0QsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQztTQUMvQixPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDL0MsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsd0dBQXdHLEVBQUUsQ0FBQyxLQUFLO1FBQ2xJLElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQztRQUNuQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckIsR0FBRyxHQUFHLEtBQUssQ0FBQztZQUNkLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDTixHQUFHLEdBQUcsUUFBUSxDQUFDO1lBQ2pCLENBQUM7UUFDSCxDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLEdBQUcsR0FBRyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5QixHQUFHLEdBQUcsTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUNELE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxHQUFHLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxTQUFTLENBQUM7SUFDNUQsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsTUFBTSxDQUFDLE1BQU0sR0FBRztJQUNkLElBQUksRUFBRSxDQUFDO0FBQ1QsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCAyMDE3IGR1bmNhbiBsYXcgKG1yZHVua0BnbWFpbC5jb20pXG5cbmxldCBjbGllbnQ7XG5sZXQgZGI7XG5cbmZ1bmN0aW9uIGluaXQoKSB7XG4gIGNsaWVudCA9IG5ldyBzdGl0Y2guU3RpdGNoQ2xpZW50KFwiZ290LXl5Z2dkXCIpO1xuICBkYiA9IGNsaWVudC5zZXJ2aWNlKFwibW9uZ29kYlwiLCBcIm1vbmdvZGItYXRsYXNcIikuZGIoXCJnb3RcIik7XG4gIGNsaWVudC5sb2dpbigpLnRoZW4oKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKFwiYXV0aGVudGljYXRlZFwiKTtcbiAgICBjb25zdCBzZXNzaW9ucyA9IGRiLmNvbGxlY3Rpb24oXCJzZXNzaW9uc1wiKTtcbiAgICBjbGllbnQuZXhlY3V0ZVBpcGVsaW5lKHtcbiAgICAgIHNlcnZpY2U6IFwibW9uZ29kYi1hdGxhc1wiLFxuICAgICAgYWN0aW9uOiBcImFnZ3JlZ2F0ZVwiLFxuICAgICAgYXJnczoge1xuICAgICAgICBkYXRhYmFzZTogXCJnb3RcIixcbiAgICAgICAgY29sbGVjdGlvbjogXCJzZXNzaW9uc1wiLFxuICAgICAgICBwaXBlbGluZTogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgICRncm91cDoge1xuICAgICAgICAgICAgICBfaWQ6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcIiRuYW1lXCIsXG4gICAgICAgICAgICAgICAgb3NfZmFtaWx5OiBcIiRvc19mYW1pbHlcIixcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBcIiR2ZXJzaW9uXCIsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGNvdW50OiB7XG4gICAgICAgICAgICAgICAgJHN1bTogMSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgcnVuX3RpbWVfYXZlcmFnZToge1xuICAgICAgICAgICAgICAgICRhdmc6IFwiJHJ1bl90aW1lXCIsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGZwc19mcmFtZV9hdmVyYWdlOiB7XG4gICAgICAgICAgICAgICAgJGF2ZzogXCIkZnBzX2ZyYW1lXCIsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGZwc19mcmFtZV9zdGREZXZQb3A6IHtcbiAgICAgICAgICAgICAgICAkc3RkRGV2UG9wOiBcIiRmcHNfZnJhbWVcIixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgZnBzX2ZyYW1lX3N0ZERldlNhbXA6IHtcbiAgICAgICAgICAgICAgICAkc3RkRGV2U2FtcDogXCIkZnBzX2ZyYW1lXCIsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGZwc19sb25nX2F2ZXJhZ2U6IHtcbiAgICAgICAgICAgICAgICAkYXZnOiBcIiRmcHNfbG9uZ1wiLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmcHNfbG9uZ19zdGREZXZQb3A6IHtcbiAgICAgICAgICAgICAgICAkc3RkRGV2UG9wOiBcIiRmcHNfbG9uZ1wiLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBmcHNfbG9uZ19zdGREZXZTYW1wOiB7XG4gICAgICAgICAgICAgICAgJHN0ZERldlNhbXA6IFwiJGZwc19sb25nXCIsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgIH0sIHtcbiAgICAgIGFsbG93RGlza1VzZTogdHJ1ZSxcbiAgICB9KVxuICAgICAgLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcInN1Y2Nlc3M6IFwiLCByZXN1bHQpO1xuICAgICAgICBkaXNwbGF5RGF0YShyZXN1bHQpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yOiBcIiwgZSk7XG4gICAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGRpc3BsYXlEYXRhKGRhdGEpIHtcbiAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RhdHNcIik7XG4gIGVsZW1lbnQuaW5uZXJIVE1MID0gc3ludGF4SGlnaGxpZ2h0KGRhdGEpO1xufVxuXG4vLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy80ODEwODQxL2hvdy1jYW4taS1wcmV0dHktcHJpbnQtanNvbi11c2luZy1qYXZhc2NyaXB0XG5mdW5jdGlvbiBzeW50YXhIaWdobGlnaHQoanNvbikge1xuICBpZiAodHlwZW9mIGpzb24gIT09IFwic3RyaW5nXCIpIHtcbiAgICBqc29uID0gSlNPTi5zdHJpbmdpZnkoanNvbiwgdW5kZWZpbmVkLCAyKTtcbiAgfVxuICBqc29uID0ganNvbi5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIilcbiAgICAucmVwbGFjZSgvPC9nLCBcIiZsdDtcIikucmVwbGFjZSgvPi9nLCBcIiZndDtcIik7XG4gIHJldHVybiBqc29uLnJlcGxhY2UoLyhcIihcXFxcdVthLXpBLVowLTldezR9fFxcXFxbXnVdfFteXFxcXFwiXSkqXCIoXFxzKjopP3xcXGIodHJ1ZXxmYWxzZXxudWxsKVxcYnwtP1xcZCsoPzpcXC5cXGQqKT8oPzpbZUVdWytcXC1dP1xcZCspPykvZywgKG1hdGNoKSA9PiB7XG4gICAgbGV0IGNscyA9IFwibnVtYmVyXCI7XG4gICAgaWYgKC9eXCIvLnRlc3QobWF0Y2gpKSB7XG4gICAgICBpZiAoLzokLy50ZXN0KG1hdGNoKSkge1xuICAgICAgICBjbHMgPSBcImtleVwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2xzID0gXCJzdHJpbmdcIjtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKC90cnVlfGZhbHNlLy50ZXN0KG1hdGNoKSkge1xuICAgICAgY2xzID0gXCJib29sZWFuXCI7XG4gICAgfSBlbHNlIGlmICgvbnVsbC8udGVzdChtYXRjaCkpIHtcbiAgICAgIGNscyA9IFwibnVsbFwiO1xuICAgIH1cbiAgICByZXR1cm4gXCI8c3BhbiBjbGFzcz1cXFwiXCIgKyBjbHMgKyBcIlxcXCI+XCIgKyBtYXRjaCArIFwiPC9zcGFuPlwiO1xuICB9KTtcbn1cblxud2luZG93Lm9ubG9hZCA9ICgpID0+IHtcbiAgaW5pdCgpO1xufTtcblxuIl19
