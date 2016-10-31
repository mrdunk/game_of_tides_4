// Copyright 2016 duncan law (mrdunk@gmail.com)

/*global default_view*/
/*global second_view*/
/*global Scene*/
/*global Worker*/
/*global game_loop*/


var WorkerInterface = function(options){

  function onError(e) {
    console.log([
        'ERROR: Line ', e.lineno, ' in ', e.filename, ': ', e.message
    ].join(''));
    this.busy = false;
    this.ExecuteTask();
  }

  /* Queue up a task to be executed on the WebWorker. */
  this.busy = false;
  this.tasks = [];
  this.QueueTask = function(label, task){
    this.tasks.push([label, task]);
    this.ExecuteTask();
  }

  /* Pop a task from the queue and execute it. */
  this.ExecuteTask = function(){
    if(this.busy === false && this.tasks.length > 0){
      this.busy = true;
      var task = this.tasks.shift();
      console.log('Executing: ', task);
      worker.postMessage(task[1]);
    }
  }

  /* Clear all tasks with a specific label from the queue. */
  this.ClearTasks = function(label){
    for(var i=this.tasks.length -1; i >= 0; i--){
      if(label === undefined || label === this.tasks[i][0]){
        this.tasks.splice(i, 1);
      }
    }
  }

  /* Gets called in response to a self.postMessage() in the worker thread. */ 
  function onMsg (e) {
    //console.log(e);

    var data = e.data;
    switch (data.type) {
      case 'geometry':
        //console.log('landscape:', data);
        var position = new Float32Array(data.position);
        var color = new Float32Array(data.color);

        // TODO: Don't just poke variables in another object.
        var landscape = game_loop.renderer.scene.CreateObject(
            data.index_high, data.index_low, data.recursion, position, color);
        landscape.recursion = data.recursion;
        game_loop.renderer.scene.addLandscape(landscape);
        break;
      case 'face':
        //console.log('face:', data);
        game_loop.renderer.scene.receivedFace(data);
        break;
      default:
        console.log(data);
    }
    this.busy = false;
    this.ExecuteTask();
  }

  var worker = new Worker('worker.js');
  this.worker = worker;
  worker.addEventListener('message', onMsg.bind(this), false);
  worker.addEventListener('error', onError.bind(this), false);


  /*worker.postMessage({
    cmd: 'ws_con',
    url: game_loop.options.data.websockets.settings.url.value,
    protocol: game_loop.options.data.websockets.settings.protocol.value
  });*/

  /* Callbacks for the Menu system. */
  var ConnectWs = function(data) {
    console.log('ConnectWs', data, this);
    var task = {cmd: 'ws_con', url: data.websockets.settings.url.value,
      protocol: data.websockets.settings.protocol.value };
    game_loop.worker_interface.QueueTask('ws_con', task);
  };

  var DisconnectWs = function(data) {
    console.log('DisconnectWs');
    var task = {cmd: 'ws_discon'};
    game_loop.worker_interface.QueueTask('ws_discon', task);
  };

  var SendViaWs = function(data) {
    console.log('SendViaWs');
    var task = {cmd: 'ws_send', data: data.websockets.settings.test_message.value};
    game_loop.worker_interface.QueueTask('ws_send', task);
  };

  /* Configuration data for this module. To be inserted into the Menu. */
  this.menu_data = [
  {
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
  }]

  if(options){
    options.RegisterClient(this);
  }
};

