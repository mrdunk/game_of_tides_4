
var select_string = function(context){
  var return_val = document.createElement('input');

  return_val.setAttribute('value', context.value);
  
  return_val.addEventListener('change', function(){context.value = this.value;});

  return return_val;
}

var select_number = function(context){
  var return_val = document.createElement('input');
  
  return_val.setAttribute('type', 'number');
  return_val.setAttribute('min', 1);
  return_val.setAttribute('max', 120);
  return_val.setAttribute('value', context.value);
  
  return_val.addEventListener('change', function(){context.value = this.value;});

  return return_val;
}

var select_boolean = function(context){
  var return_val = document.createElement('input');
  
  return_val.setAttribute('type', 'checkbox');
  return_val.checked = context.value;
  
  return_val.addEventListener('change', function(){context.value = this.checked;});
  
  return return_val;
}

var execute = function(context){
  var return_val = document.createElement('button');
  return_val.innerHTML = 'Send';
  return_val.addEventListener("click", context.value);
  return return_val;
}

var connect_ws = function(data){
  console.log('connect_ws', options.websockets.settings.url.value);
  worker.postMessage({cmd: 'ws_con', url: options.websockets.settings.url.value});
}

var disconnect_ws = function(data){
  console.log('disconnect_ws');
  worker.postMessage({cmd: 'ws_discon'});
}

var send_via_ws = function(data){
  console.log('send_via_ws');
  worker.postMessage({cmd: 'ws_send', data: options.websockets.settings.test_message.value});
}


var options = {
  game_loop: {
    description: 'game_loop',
    settings: {
      fps: {
        description: 'FPS',
        type: select_number,
        value: 10
      },
      log_fps: {
        description: 'Log FPS',
        type: select_boolean,
        value: false
      }
    }
  },
  camera: {
    description: 'camera',
    settings: {
    }
  },
  websockets: {
    description: 'websockets',
    settings: {
      url: {
        description: 'Server URL',
        type: select_string,
        value: 'wss://game-of-tides-mrdunk.c9users.io:8081'
      },
      connect: {
        description: 'Connect WebSocket',
        type: execute,
        value: connect_ws
      },
      disconnect: {
        description: 'Disconnect WebSocket',
        type: execute,
        value: disconnect_ws
      },
      test_message:{
        description: 'test message:',
        type: select_string,
        value: 'test'
      },
      test_send: {
        description: 'send test:',
        type: execute,
        value: send_via_ws
      }
    }
  }
};

var openNav = function(){
  document.getElementById("nav_menu").style.height = "100%";
}

var closeNav = function(){
  document.getElementById("nav_menu").style.height = "0%";
}

var populate_menu = function(){
  var content = document.createElement('ul');
  document.getElementsByClassName('overlay-content')[0].appendChild(content);
  
  for(var section in options){
    var section_content = document.createElement('li');
    content.appendChild(section_content);
    
    var section_description = document.createElement('div');
    section_content.appendChild(section_description);
    section_description.innerHTML = options[section].description;
    
    var section_list = document.createElement('ul');
    section_content.appendChild(section_list);
    
    for(var setting in options[section].settings){
      var data = options[section].settings[setting];
      if(true){
        var setting_content = document.createElement('li');
        section_list.appendChild(setting_content);
        
        var setting_description = document.createElement('div');
        setting_content.appendChild(setting_description);
        setting_description.innerHTML = data.description;
        
        setting_description.appendChild(data.type(data));
      }
    }
  }
}
