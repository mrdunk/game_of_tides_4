// Copyright 2016 duncan law (mrdunk@gmail.com)

importScripts('3rdparty/three.js');
importScripts('wrap_terrain.js');
  

self.postMessage('Spawned worker:', self._id);

var terrain_generator = new Module.DataSourceGenerate();
terrain_generator.MakeCache();

var getGeometry = function(face_index_high, face_index_low,
                           recursion_start, required_depth)
{
  var time_start = performance.now();
  var face;
  var terrain_data, i;
  var return_data = {};
  var height_multiplier = 0.02;
  var sea_level = 1.1;

  var faces = terrain_generator.getFaces(face_index_high, face_index_low,
                                            recursion_start, required_depth);
  var faces_and_skirt = terrain_generator.getFacesAndSkirt(faces);
  //var skirt = terrain_generator.getSkirt(faces, faces_and_skirt);

  var terrain_data = faces_and_skirt;

  var geometry = new THREE.Geometry();

  for(i = 0; i < terrain_data.size(); i++){
    face = terrain_data.get(i);

    if(face.heights[0] > sea_level){
      geometry.vertices.push(new THREE.Vector3(
            face.points[0][0] * (1 + (face.heights[0] * height_multiplier)),
            face.points[0][1] * (1 + (face.heights[0] * height_multiplier)),
            face.points[0][2] * (1 + (face.heights[0] * height_multiplier))));
      geometry.colors.push(new THREE.Color(face.heights[0] /4,
                                           face.heights[0] /2,
                                           face.heights[0] /4));
    } else {
      geometry.vertices.push(new THREE.Vector3(
            face.points[0][0] * (1 + (sea_level * height_multiplier)),
            face.points[0][1] * (1 + (sea_level * height_multiplier)),
            face.points[0][2] * (1 + (sea_level * height_multiplier))));
      var depth_multiplier =
        sea_level - ((sea_level - face.heights[0]) * (recursion_start*recursion_start +1));
      geometry.colors.push(new THREE.Color(depth_multiplier * 0.7,
                                           depth_multiplier * 0.3,
                                           depth_multiplier * 0.1));
    }
      
    if(face.heights[1] > sea_level){
      geometry.vertices.push(new THREE.Vector3(
            face.points[1][0] * (1 + (face.heights[1] * height_multiplier)),
            face.points[1][1] * (1 + (face.heights[1] * height_multiplier)),
            face.points[1][2] * (1 + (face.heights[1] * height_multiplier))));
      geometry.colors.push(new THREE.Color(face.heights[1] /4,
                                           face.heights[1] /2,
                                           face.heights[1] /4));
    } else{
      geometry.vertices.push(new THREE.Vector3(
            face.points[1][0] * (1 + (sea_level * height_multiplier)),
            face.points[1][1] * (1 + (sea_level * height_multiplier)),
            face.points[1][2] * (1 + (sea_level * height_multiplier))));
      var depth_multiplier =
        sea_level - ((sea_level - face.heights[1]) * (recursion_start*recursion_start +1));
      geometry.colors.push(new THREE.Color(depth_multiplier * 0.7,
                                           depth_multiplier * 0.3,
                                           depth_multiplier * 0.1));
    }
      
      
    if(face.heights[2] > sea_level){
      geometry.vertices.push(new THREE.Vector3(
            face.points[2][0] * (1 + (face.heights[2] * height_multiplier)),
            face.points[2][1] * (1 + (face.heights[2] * height_multiplier)),
            face.points[2][2] * (1 + (face.heights[2] * height_multiplier))));
      geometry.colors.push(new THREE.Color(face.heights[2] /4,
                                           face.heights[2] /2,
                                           face.heights[2] /4));
    } else{
      geometry.vertices.push(new THREE.Vector3(
            face.points[2][0] * (1 + (sea_level * height_multiplier)),
            face.points[2][1] * (1 + (sea_level * height_multiplier)),
            face.points[2][2] * (1 + (sea_level * height_multiplier))));
      var depth_multiplier = 
        sea_level - ((sea_level - face.heights[2]) * (recursion_start*recursion_start +1));
      geometry.colors.push(new THREE.Color(depth_multiplier * 0.7,
                                           depth_multiplier * 0.3,
                                           depth_multiplier * 0.1));
    }
      

    geometry.faces.push(new THREE.Face3(3 * i, 3 * i + 1, 3 * i + 2));

    face.delete();
  }
  terrain_data.delete();
  terrain_generator.cleanCache(20000000);
  
  geometry.mergeVertices();

  var buffer_geometry = new THREE.BufferGeometry().fromGeometry(geometry);
  console.log(geometry, buffer_geometry, buffer_geometry.getAttribute('color').array.buffer);

  return_data.index_high = face_index_high;
  return_data.index_low = face_index_low;
  return_data.recursion_min = recursion_start;
  return_data.recursion_max = required_depth;
  return_data.position = buffer_geometry.getAttribute('position').array.buffer;
  
  // NOTE: For some reason we cannot access 'color' attribute directly so we need to copy
  // it into a buffer manually.
  //return_data.color = buffer_geometry.getAttribute('color').array.buffer;
  var colors = new Float32Array(geometry.colors.length * 3);
  for(var i = 0; i < geometry.colors.length; i++){
    colors[i * 3 + 0] = geometry.colors[i].b;
    colors[i * 3 + 1] = geometry.colors[i].g;
    colors[i * 3 + 2] = geometry.colors[i].r;
  }
  return_data.color = colors.buffer;

  return_data.time_to_generate = performance.now() - time_start;
  return return_data;
};

var getFaceFromCentre = function(centre, recursion){
  console.log('getFaceFromCentre(', centre, ')');
  return terrain_generator.pointToFace(centre, recursion);
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
  //console.log(data);
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
      return_value.view = data.view;
      console.log(return_value);
      self.postMessage(return_value, [return_value.position, return_value.color]);
      break;
    case 'face_from_centre':
      var face = getFaceFromCentre(data.centre, data.recursion);
      return_value.type = 'face';
      return_value.view = data.view;
      return_value.recursion = data.recursion;
      return_value.index_high = face.index_high;
      return_value.index_low = face.index_low;
      var neighbours = {};
      neighbours.size = face.neighbours.size();
      for(var i=0; i < neighbours.size; i++){
        neighbours[i] = face.neighbours.get(i);
      }
      return_value.neighbours = neighbours;
      self.postMessage(return_value);
      face.delete();
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
