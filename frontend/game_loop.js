/*global options*/

var game_loop = {};
;(function () {
  game_loop.last_drawn = window.performance.now();
  
  var main = function ( tFrame ) {
    game_loop.stopMain = window.requestAnimationFrame( main );
    if (game_loop.last_drawn + (1000 / options.game_loop.settings.fps.value) <= tFrame) {
      // Let's draw the thing.
      if(options.game_loop.settings.log_fps.value){
        console.log('draw frame', tFrame - game_loop.last_drawn);
      }
      game_loop.last_drawn = tFrame;

      if(typeof default_view !== 'undefined'){
        default_view.render();
      }
      if(typeof second_view !== 'undefined'){
        second_view.render();
      }
    }
  };
  
  var start = function(){
    console.log('...starting game_loop.');
    main(window.performance.now()); // Start the cycle
    populate_menu();
  };
  window.onload = start;
})();