
class MainLoop {
  public static FPS = 0;
  public static averageFPS = 0;
  public static lastDrawFrame = -1;
  public static renderers = [];

  public static startRendering() {
    if(MainLoop.lastDrawFrame >= 0) {
      console.log("ERROR: Already rendering.");
      return;
    }

    this.averageFPS = maxFps;
    MainLoop.lastDrawFrame = Date.now();
    MainLoop.startSecond = MainLoop.lastDrawFrame;
    MainLoop.framesInSecond = 0;
    MainLoop.drawFrame();
  }

  public static drawFrame() {
    if(MainLoop.lastDrawFrame < 0) {
      console.log("Rendering stopped.");
      return;
    }

    MainLoop.frameId = requestAnimationFrame(MainLoop.drawFrame);

    const now = Date.now();
    let diff = now - MainLoop.lastDrawFrame;
    if(diff >= 1000 / maxFps || MainLoop.averageFPS < maxFps * 0.97) {
      diff %= (1000 / maxFps);
      MainLoop.lastDrawFrame = now - diff;

      for(const renderer in MainLoop.renderers) {
        if(MainLoop.renderers.hasOwnProperty(renderer)) {
          MainLoop.renderers[renderer].service(now);
          UIMaster.service(now);
        }
      }

      MainLoop.framesInSecond += 1;
      if(now - MainLoop.startSecond >= 1000) {
        if(now - MainLoop.startSecond >= 2000) {
          MainLoop.FPS = 0;
          MainLoop.framesInSecond = 0;
          MainLoop.startSecond = now;
        } else {
          MainLoop.FPS = MainLoop.framesInSecond;
          // MainLoop.FPS = (0.25 * MainLoop.FPS) +
          //  (0.75 * MainLoop.framesInSecond);
          MainLoop.averageFPS = (0.90 * MainLoop.averageFPS) +
            (0.10 * MainLoop.framesInSecond);
          MainLoop.startSecond += 1000;
          MainLoop.framesInSecond = 0;
        }
      }
    }
  }

  public static stopRendering() {
    if(MainLoop.lastDrawFrame < 0) {
      console.log("ERROR: Not currently rendering.");
      return;
    }

    console.log("Stopping rendering.");
    MainLoop.lastDrawFrame = -1;
    cancelAnimationFrame(MainLoop.frameId);
  }

  private static frameId = undefined;
  private static startSecond = undefined;
  private static framesInSecond = undefined;
}


