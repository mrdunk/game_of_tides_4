// Copyright 2016 duncan law (mrdunk@gmail.com)

/*global default_view*/
/*global second_view*/
/*global Scene*/
/*global Worker*/
/*global game_loop*/

// ;(function () {

var WorkerInterface = function(options){

  function onError(e) {
    console.log([
        'ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message
    ].join(''));
  }

  /* Gets called in response to a self.postMessage() in the worker thread. */ 
  function onMsg (e) {
    console.log(e);

    var data = e.data;
    switch (data.type) {
      case 'geometry':
        console.log('landscape:', data);
        var position = new Float32Array(data.position);
        var color = new Float32Array(data.color);
        var normal = new Float32Array(data.normal);

        // TODO: Don't just poke variables in another object.
        var landscape = new game_loop.renderer.CreateScene(position, color, normal);
        game_loop.renderer.SetScene(landscape);
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

  /*worker.postMessage({
    cmd: 'ws_con',
    url: game_loop.options.data.websockets.settings.url.value,
    protocol: game_loop.options.data.websockets.settings.protocol.value
  });*/

  /* Callbacks for the Menu system. */
  var ConnectWs = function(data) {
    console.log('ConnectWs', data, this);
    worker.postMessage({
      cmd: 'ws_con',
      url: data.websockets.settings.url.value,
      protocol: data.websockets.settings.protocol.value
    });
  };

  var DisconnectWs = function(data) {
    console.log('DisconnectWs');
    worker.postMessage({
      cmd: 'ws_discon'
    });
  };

  var SendViaWs = function(data) {
    console.log('SendViaWs');
    worker.postMessage({
      cmd: 'ws_send',
      data: data.websockets.settings.test_message.value
    });
  };

  /* Configuration data for this module. To be inserted into the Menu. */
  this.menu_data = {
    name: "websockets",
    content: {
      description: 'websockets',
      settings: {
        url: {
          description: 'Server URL',
          type: options.SelectString,
          value: 'wss://192.168.192.251:8081'
        },
        protocol: {
          description: 'WS protocol',
          type: options.SelectString,
          value: 'tides'
        },
        connect: {
          description: 'Connect WebSocket',
          type: options.Execute,
          value: ConnectWs        // Custom callback defined above.
        },
        disconnect: {
          description: 'Disconnect WebSocket',
          type: options.Execute,
          value: DisconnectWs    // Custom callback defined above.
        },
        test_message: {
          description: 'test message:',
          type: options.SelectString,
          value: 'test'
        },
        test_send: {
          description: 'send test:',
          type: options.Execute,
          value: SendViaWs       // Custom callback defined above.
        }
      }
    }
  }

  if(options){
    options.RegisterClient(this);
  }
};

// })();
