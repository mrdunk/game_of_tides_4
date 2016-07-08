// Copyright 2016 duncan law (mrdunk@gmail.com)

importScripts('3rdparty/three.js');
self.postMessage('Spawned worker:', self._id);

var getGeometry = function(){
  var geometry = new THREE.BoxGeometry( 1, 1, 1 );
  var bufferGeometry = new THREE.BufferGeometry().fromGeometry( geometry );
  var vertices = bufferGeometry.getAttribute('position').array;
  return vertices.buffer;
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

  this_.onmessage = function(){
    self.postMessage('WS receive');
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
      return_value.type = 'landscape';
      return_value.data = getGeometry();
      self.postMessage(return_value, [return_value.data]);
      //self.postMessage(return_value);
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
