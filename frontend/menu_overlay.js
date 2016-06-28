/*global store*/
/*global worker*/
/*global location*/

var Options = function () {
  var SaveData = function (data) {
    // TODO: We don't need to save the whole structure, only user modifiable values.
    console.log('saving: ', data)
    store.set('options', data)
  }

  var SelectString = function (context, data) {
    var return_val = document.createElement('input')

    return_val.setAttribute('value', context.value)

    return_val.addEventListener('change', function () {
      context.value = this.value
      SaveData(data)
    })

    return return_val
  }

  var SelectNumber = function (context, data) {
    var return_val = document.createElement('input')

    return_val.setAttribute('type', 'number')
    return_val.setAttribute('min', 1)
    return_val.setAttribute('max', 120)
    return_val.setAttribute('value', context.value)

    return_val.addEventListener('change', function () {
      context.value = this.value
      SaveData(data)
    })

    return return_val
  }

  var SelectBoolean = function (context, data) {
    var return_val = document.createElement('input')

    return_val.setAttribute('type', 'checkbox')
    return_val.checked = context.value

    return_val.addEventListener('change', function () {
      context.value = this.checked
      SaveData(data)
    })

    return return_val
  }

  var Execute = function (context) {
    var return_val = document.createElement('button')
    return_val.innerHTML = 'Send'
    return_val.addEventListener('click', context.value)
    return return_val
  }

  var ConnectWs = function (data) {
    console.log('ConnectWs', this.data.websockets.settings.url.value)
    worker.postMessage({
      cmd: 'ws_con',
      url: this.data.websockets.settings.url.value
    })
  }

  var DisconnectWs = function (data) {
    console.log('DisconnectWs')
    worker.postMessage({
      cmd: 'ws_discon'
    })
  }

  var SendViaWs = function (data) {
    console.log('SendViaWs')
    worker.postMessage({
      cmd: 'ws_send',
      data: this.data.websockets.settings.test_message.value
    })
  }

  var DefaultSettings = function (data) {
    console.log('DefaultSettings..')
      //store.remove('data')
    store.clear()
    console.log('done.')
    console.log(store.get('data'))
    location.reload()
  }

  this.data = {
    general: {
      description: 'General settings',
      settings: {
        default_settings: {
          description: 'Reset everything to default values',
          type: Execute,
          value: DefaultSettings
        }
      }
    },
    game_loop: {
      description: 'game_loop',
      settings: {
        fps: {
          description: 'FPS',
          type: SelectNumber,
          value: 10
        },
        log_fps: {
          description: 'Log FPS',
          type: SelectBoolean,
          value: false
        }
      }
    },
    camera: {
      description: 'camera',
      settings: {}
    },
    websockets: {
      description: 'websockets',
      settings: {
        url: {
          description: 'Server URL',
          type: SelectString,
          value: 'wss://192.168.192.251:8081'
        },
        connect: {
          description: 'Connect WebSocket',
          type: Execute,
          value: ConnectWs
        },
        disconnect: {
          description: 'Disconnect WebSocket',
          type: Execute,
          value: DisconnectWs
        },
        test_message: {
          description: 'test message:',
          type: SelectString,
          value: 'test'
        },
        test_send: {
          description: 'send test:',
          type: Execute,
          value: SendViaWs
        }
      }
    }
  }

  this.openNav = function () {
    document.getElementById('nav_menu').style.height = '100%'
  }

  this.closeNav = function () {
    document.getElementById('nav_menu').style.height = '0%'
  }

  this.PopulateMenu = function () {
    var content = document.createElement('ul')
    document.getElementsByClassName('overlay-content')[0].appendChild(
      content)

    for (var section in this.data) {
      var section_content = document.createElement('li')
      content.appendChild(section_content)

      var section_description = document.createElement('div')
      section_content.appendChild(section_description)
      section_description.innerHTML = this.data[section].description

      var section_list = document.createElement('ul')
      section_content.appendChild(section_list)

      for (var setting in this.data[section].settings) {
        var data = this.data[section].settings[setting]
        if (true) {
          var setting_content = document.createElement('li')
          section_list.appendChild(setting_content)

          var setting_description = document.createElement('div')
          setting_content.appendChild(setting_description)
          setting_description.innerHTML = data.description
          setting_description.appendChild(data.type(data, this.data))
        }
      }
    }
  }

  var MergeValues = function (source, destination) {
    if (typeof source === 'object') {
      for (var property in source) {
        console.log(property, source[property])
        if (property === 'value' && typeof source[property] !==
          'object') {
          destination[property] = source[property]
          return
        }
        if (property !== 'description' && property !== 'type' && property !==
          'value') {
          MergeValues(source[property], destination[property])
        }
      }
    }
  }

  var data_saved
  if (store.enabled) {
    data_saved = store.get('options')
  }
  if (typeof data_saved === 'undefined') {
    console.log('No saved_data found. using default.')
  } else {
    console.log('Restoring saved_data.')
    MergeValues(data_saved, this.data)
  }

  console.log(this.data)
  console.log(data_saved)
}
