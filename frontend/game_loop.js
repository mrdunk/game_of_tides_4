// Copyright 2016 duncan law (mrdunk@gmail.com)

/*global options*/

var game_loop = {};

(function () {
  game_loop.last_drawn = window.performance.now();

  var main = function (tFrame) {
    game_loop.stopMain = window.requestAnimationFrame(main);
    if (game_loop.last_drawn + 
        (1000 / game_loop.options.data.game_loop.settings.fps.value) <= tFrame)
    {
      // Let's draw the thing.
      if (game_loop.options.data.game_loop.settings.log_fps.value) {
        console.log('draw frame', tFrame - game_loop.last_drawn);
      }
      game_loop.last_drawn = tFrame;

      game_loop.renderer.Update();
    }
  };

  var start = function () {
    console.log('...starting game_loop.');
    game_loop.options = new Options();
    game_loop.worker_interface = new WorkerInterface(game_loop.options);
    game_loop.renderer = new Renderer(game_loop.options);
  
    game_loop.renderer.RegisterView(window.innerWidth, window.innerHeight /2); 
    game_loop.renderer.RegisterView(window.innerWidth /4, window.innerHeight /4); 

    main(window.performance.now()); // Start the cycle
  };
  window.onload = start;
})();
