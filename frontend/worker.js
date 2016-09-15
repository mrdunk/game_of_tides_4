// Copyright 2016 duncan law (mrdunk@gmail.com)

importScripts('3rdparty/three.js');
importScripts('build/wrap_terrain.js');

self.postMessage('Spawned worker:', self._id);

var getGeometry = function(){
  var recursion = 5;
  var total = 0;
  var face;
  var terrain_generator = new Module.DataSourceGenerate();
  var terrain_data, i;
  var return_data = {};

  var vertices = new Float32Array(Math.pow(4,recursion) * 8 * 9);
  var color = new Float32Array(Math.pow(4,recursion) * 8 * 9);
  for(var root_face = 0; root_face < 8; root_face++){
    terrain_data = terrain_generator.getFaces(root_face * Math.pow(2, 29),0,0,recursion);
    for(i = 0; i < terrain_data.size(); i++){
      face = terrain_data.get(i);
      vertices[total +0] = face.points[0][0];
      vertices[total +1] = face.points[0][1];
      vertices[total +2] = face.points[0][2];
      vertices[total +3] = face.points[1][0];
      vertices[total +4] = face.points[1][1];
      vertices[total +5] = face.points[1][2];
      vertices[total +6] = face.points[2][0];
      vertices[total +7] = face.points[2][1];
      vertices[total +8] = face.points[2][2];

      color[total +0] = 0.05 * face.height;
      color[total +3] = 0.05 * face.height;
      color[total +6] = 0.05 * face.height;

      total  = total +9;
    }
    terrain_data.delete();
  }
  terrain_generator.delete();

  return_data.position = vertices.buffer;
  return_data.color = color.buffer;
  return return_data;
};

var WebSocketWrapper = function(){
  this.web_socket = null;
  var this_ = this;
  this.connect = function(data){
    var timeout = 0;
    while(this_.web_socket && this_.web_socket.readyState === this_.web_socket.CLOSING){
      if(timeout++ > 10000){
        self.postMessage('Error: WS stuck in CLOSING state.');
        return;
      }
    }

    if(!this_.web_socket || this_.web_socket.readyState === this_.web_socket.CLOSED){
      this_.web_socket = new WebSocket(data.url, [data.protocol]);
      this_.web_socket.onopen = this_.onopen;
      this_.web_socket.onclose = this_.onclose;
      this_.web_socket.onmessage = this_.onmessage;
      this_.web_socket.onerror = this_.onerror;
      return;
    } else if(this_.web_socket.readyState === this_.web_socket.OPEN){
      this_.web_socket.send('Ping');
      self.postMessage('WS already open');
      return;
    } else if(this_.web_socket.readyState === this_.web_socket.CONNECTING){
      self.postMessage('WS connecting');
      return;
    }
    self.postMessage('Error: WebSocketWrapper.connect(): web_socket not in an expected state.');
  };

  this.send = function(data){
    if(!this_.web_socket || this_.web_socket.readyState !== this_.web_socket.OPEN) {
      self.postMessage('WebSocket not connected.');
      return;
    }
    this_.web_socket.send(data);
  };

  this.close = function(){
    if(!this_.web_socket || this_.web_socket.readyState !== this_.web_socket.OPEN) {
      self.postMessage('Attempted disconnect when WebSocket not connected.');
      return;
    }
    this_.web_socket.close();
  };

  this.onopen = function(event){
    self.postMessage('WS open');
    this_.web_socket.send('Ping');
  };

  this_.onclose = function(){
    self.postMessage('WS close');
  };

  this_.onmessage = function(event){
    self.postMessage('WS receive');
    self.postMessage(JSON.stringify(event.data));
  };

  this_.onerror = function(){
    self.postMessage('WS error');
  };
};

var web_socket = new WebSocketWrapper();

self.addEventListener('message', function(e) {
  var data = e.data;
  //self.postMessage(data);
  var return_value = {};
  switch (data.cmd) {
    case 'echo':
      return_value.type = 'echo';
      return_value.data = data;
      self.postMessage(return_value);
      break;
    case 'landscape':
      return_value = getGeometry();
      return_value.type = 'geometry';
      self.postMessage(return_value, [return_value.position, return_value.color]);
      break;
    case 'stop':
      return_value.type = 'stop';
      self.postMessage(return_value);
      self.close(); // Terminates the worker.
      break;
    case 'ws_con':
      web_socket.connect(data);
      break;
    case 'ws_discon':
      web_socket.close();
      break;
    case 'ws_send':
      web_socket.send(data.data);
      break;
    default:
      self.postMessage('Unknown command: ' + data.msg);
  }
}, false);
