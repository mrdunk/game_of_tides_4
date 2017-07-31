
class MainLoop {
  public static FPS = 0;
  public static lastDrawFrame = -1;
  public static renderers = [];

  public static startRendering() {
    if(MainLoop.lastDrawFrame >= 0) {
      console.log("ERROR: Already rendering.");
      return;
    }

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

    const now = Date.now();
    let diff = now - MainLoop.lastDrawFrame;
    if(diff >= 1000 / maxFps) {
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
          MainLoop.FPS = (0.25 * MainLoop.FPS) +
            (0.75 * MainLoop.framesInSecond);
          MainLoop.startSecond += 1000;
          MainLoop.framesInSecond = 0;
        }
      }
    }

    MainLoop.frameId = requestAnimationFrame(MainLoop.drawFrame);
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


