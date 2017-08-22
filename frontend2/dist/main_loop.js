var MainLoop = (function () {
    function MainLoop() {
    }
    MainLoop.startRendering = function () {
        if (MainLoop.lastDrawFrame >= 0) {
            console.log("ERROR: Already rendering.");
            return;
        }
        this.averageFPS = maxFps;
        this.longAverageFPS = maxFps;
        MainLoop.lastDrawFrame = Date.now();
        MainLoop.startSecond = MainLoop.lastDrawFrame;
        MainLoop.framesInSecond = 0;
        MainLoop.drawFrame();
    };
    MainLoop.drawFrame = function () {
        if (MainLoop.lastDrawFrame < 0) {
            console.log("Rendering stopped.");
            return;
        }
        MainLoop.frameId = requestAnimationFrame(MainLoop.drawFrame);
        var now = Date.now();
        var diff = now - MainLoop.lastDrawFrame;
        if (diff >= 1000 / maxFps ||
            (MainLoop.averageFPS < maxFps * 0.95 && MainLoop.FPS < maxFps * 0.95)) {
            diff %= (1000 / maxFps);
            MainLoop.lastDrawFrame = now - diff;
            for (var renderer in MainLoop.renderers) {
                if (MainLoop.renderers.hasOwnProperty(renderer)) {
                    MainLoop.renderers[renderer].service(now);
                    UIMaster.service(now);
                }
            }
            MainLoop.framesInSecond += 1;
            if (now - MainLoop.startSecond >= 1000) {
                if (now - MainLoop.startSecond >= 2000) {
                    MainLoop.FPS = 0;
                    MainLoop.framesInSecond = 0;
                    MainLoop.startSecond = now;
                }
                else {
                    MainLoop.FPS = MainLoop.framesInSecond;
                    MainLoop.averageFPS = (0.95 * MainLoop.averageFPS) +
                        (0.05 * MainLoop.framesInSecond);
                    MainLoop.longAverageFPS = (0.99 * MainLoop.longAverageFPS) +
                        (0.01 * MainLoop.framesInSecond);
                    MainLoop.startSecond += 1000;
                    MainLoop.framesInSecond = 0;
                }
            }
        }
    };
    MainLoop.stopRendering = function () {
        if (MainLoop.lastDrawFrame < 0) {
            console.log("ERROR: Not currently rendering.");
            return;
        }
        console.log("Stopping rendering.");
        MainLoop.lastDrawFrame = -1;
        cancelAnimationFrame(MainLoop.frameId);
    };
    MainLoop.FPS = 0;
    MainLoop.averageFPS = 0;
    MainLoop.longAverageFPS = 0;
    MainLoop.lastDrawFrame = -1;
    MainLoop.renderers = [];
    MainLoop.frameId = undefined;
    MainLoop.startSecond = undefined;
    MainLoop.framesInSecond = undefined;
    return MainLoop;
}());