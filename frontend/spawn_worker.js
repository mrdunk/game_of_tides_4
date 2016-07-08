// Copyright 2016 duncan law (mrdunk@gmail.com)

/*global default_view*/
/*global second_view*/
/*global Scene*/
/*global Worker*/
/*global game_loop*/

// ;(function () {

function onError(e) {
  console.log([
    'ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message
  ].join(''));
}

function onMsg (e) {
  var data = e.data;
  switch (data.type) {
    case 'landscape':
      console.log('landscape:', data);
      var vertices = new Float32Array(data.data);
      var landscape = new Scene(vertices);
      default_view.setScene(landscape);
      second_view.setScene(landscape);
      break;
    default:
      console.log(data);
  }
}

var worker = new Worker('worker.js');
worker.addEventListener('message', onMsg, false);
worker.addEventListener('error', onError, false);

worker.postMessage({
  cmd: 'landscape'
});
worker.postMessage({
  cmd: 'ws_con',
  url: game_loop.options.data.websockets.settings.url.value,
  protocol: game_loop.options.data.websockets.settings.protocol.value
});
  // })();
