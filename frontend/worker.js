// Copyright 2016 duncan law (mrdunk@gmail.com)

importScripts('3rdparty/three.js');
importScripts('wrap_terrain.js');
  

self.postMessage('Spawned worker:', self._id);

var getGeometry = function(face_index_high, face_index_low,
                           recursion_start, required_depth){

  var total = 0;
  var face;
  var terrain_generator = new Module.DataSourceGenerate();
  terrain_generator.MakeCache();
  var terrain_data, i;
  var return_data = {};
  var height_multiplier = 0.02;
  var sea_level = 0.8;

  var vertices = new Float32Array(Math.pow(4, (required_depth - recursion_start)) * 9);
  var color = new Float32Array(Math.pow(4, (required_depth - recursion_start)) * 9);

  terrain_data = terrain_generator.getFaces(face_index_high, face_index_low,
                                            recursion_start, required_depth);
  
  for(i = 0; i < terrain_data.size(); i++){
    face = terrain_data.get(i);
    if(face.heights[0] > sea_level){
      vertices[total +0] = face.points[0][0] * (1 + (face.heights[0] * height_multiplier));
      vertices[total +1] = face.points[0][1] * (1 + (face.heights[0] * height_multiplier));
      vertices[total +2] = face.points[0][2] * (1 + (face.heights[0] * height_multiplier));
      color[total +0] = face.heights[0] /4;
      color[total +1] = face.heights[0] /2;
      color[total +2] = face.heights[0] /4;
    } else {
      vertices[total +0] = face.points[0][0] * (1 + (sea_level * height_multiplier));
      vertices[total +1] = face.points[0][1] * (1 + (sea_level * height_multiplier));
      vertices[total +2] = face.points[0][2] * (1 + (sea_level * height_multiplier));
      color[total +0] = 0.1;
      color[total +1] = 0.3;
      color[total +2] = 0.7;
    }

    if(face.heights[1] > sea_level){
      vertices[total +3] = face.points[1][0] * (1 + (face.heights[1] * height_multiplier));
      vertices[total +4] = face.points[1][1] * (1 + (face.heights[1] * height_multiplier));
      vertices[total +5] = face.points[1][2] * (1 + (face.heights[1] * height_multiplier));
      color[total +3] = face.heights[1] /4;
      color[total +4] = face.heights[1] /2;
      color[total +5] = face.heights[1] /4;
    } else {
      vertices[total +3] = face.points[1][0] * (1 + (sea_level * height_multiplier));
      vertices[total +4] = face.points[1][1] * (1 + (sea_level * height_multiplier));
      vertices[total +5] = face.points[1][2] * (1 + (sea_level * height_multiplier));
      color[total +3] = 0.1;
      color[total +4] = 0.3;
      color[total +5] = 0.7;
    }

    if(face.heights[2] > sea_level){
      vertices[total +6] = face.points[2][0] * (1 + (face.heights[2] * height_multiplier));
      vertices[total +7] = face.points[2][1] * (1 + (face.heights[2] * height_multiplier));
      vertices[total +8] = face.points[2][2] * (1 + (face.heights[2] * height_multiplier));
      color[total +6] = face.heights[2] /4;
      color[total +7] = face.heights[2] /2;
      color[total +8] = face.heights[2] /4;
    } else {
      vertices[total +6] = face.points[2][0] * (1 + (sea_level * height_multiplier));
      vertices[total +7] = face.points[2][1] * (1 + (sea_level * height_multiplier));
      vertices[total +8] = face.points[2][2] * (1 + (sea_level * height_multiplier));
      color[total +6] = 0.1;
      color[total +7] = 0.3;
      color[total +8] = 0.7;
    }

    /*vertices[total +0] = face.points[0][0];
      vertices[total +1] = face.points[0][1];
      vertices[total +2] = face.points[0][2];
      vertices[total +3] = face.points[1][0];
      vertices[total +4] = face.points[1][1];
      vertices[total +5] = face.points[1][2];
      vertices[total +6] = face.points[2][0];
      vertices[total +7] = face.points[2][1];
      vertices[total +8] = face.points[2][2];

      color[total +0] = face.height /4;
      color[total +3] = face.height /2;
      color[total +6] = face.height /4;
      color[total +1] = face.height /2;
      color[total +4] = face.height /2;
      color[total +7] = face.height /2;
      color[total +2] = face.height /4;
      color[total +5] = face.height /4;
      color[total +8] = face.height /4;*/
    
    total  = total +9;
  }
  terrain_data.delete();
  terrain_generator.delete();

  return_data.index_high = face_index_high;
  return_data.index_low = face_index_low;
  return_data.recursion = required_depth;

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
      return_value = getGeometry(data.index_high, data.index_low,
                                 data.recursion_start, data.recursion);
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
