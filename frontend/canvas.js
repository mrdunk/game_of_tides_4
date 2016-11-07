// Copyright 2016 duncan law (mrdunk@gmail.com)

/*global THREE*/

var planet_radius = 12742 /2;

var Camera = undefined;

function webglAvailable() {
  try {
    var canvas = document.createElement( 'canvas' );
    return !!( window.WebGLRenderingContext && (
          canvas.getContext( 'webgl' ) ||
          canvas.getContext( 'experimental-webgl' ) )
        );
  } catch ( e ) {
    return false;
  }
}

var Renderer = function(options) {
  this.init = function(){
    // Load the Menu with options specific to this module.
    if(options){
      options.RegisterClient(this);
    }
    this.enable_webGL = options.data.renderer.settings.enable_webGL.value && webglAvailable();

    // Display statistics.
    this.stats = new Stats();
    document.body.appendChild( this.stats.dom );
    if(this.enable_webGL){
      this.rendererStats   = new THREEx.RendererStats();
      this.rendererStats.domElement.style.position = 'absolute';
      this.rendererStats.domElement.style.width = '200px';
      this.rendererStats.domElement.style.bottom   = '0px';
      this.rendererStats.domElement.style.right    = '0px';
      this.rendererStats.domElement.style.fontSize = '18px';
      document.body.appendChild( this.rendererStats.domElement );
    }

    this.views = [];  // All registered Viewports.
    this.scene = new Scene(this.enable_webGL);
    // Should Cursor be a property of View?
    this.cursor = new Cursor(this.scene, this.views);
  }

  this.Update = function(){
    for (var view_index = 0; view_index < this.views.length; view_index++){
      var view = this.views[view_index];
      view.mouseDirty |= view.camera.update();
      view.update();
    }

    this.stats.update();
    if(this.rendererStats){
      this.rendererStats.update(this.views[0].renderer);
    }

    this.cursor.update();
  };

  this.RegisterView = function(port_width, port_height) {
    var camera = new Camera(port_width, port_height);

    var viewport = new Viewport(port_width, port_height, camera, this.scene, this.enable_webGL);
    this.views.push(viewport);
  }.bind(this);

  var CameraDistance = function(data){
    var max_height = 20000;
    for(var i = 0; i < this.views.length; i++){
      var view = this.views[i];
      if(view.centre_view){
        var min_height = view.centre_view.length();
        var slider_ratio = data * data * data / 1000000;
        var calculated = ((max_height - min_height) * slider_ratio) + min_height;
        console.log(max_height, min_height, slider_ratio, calculated);

        view.camera.setDistance(calculated - planet_radius);
      }
    }
  }.bind(this);

  var SetRecursion = function(data){
    var new_recursion = Math.round((data * 9 / 100) +1);
    console.log(new_recursion);
    this.views[0].recursion = new_recursion;
  }.bind(this);

  var SetWireframe = function(data) {
    for(var i = 0; i < this.scene.scene.children.length; i++){
      var mesh = this.scene.scene.children[i];
      if(mesh.type === 'Mesh' && mesh.material !== undefined){
        mesh.material.wireframe = data;
      }
    }
  }.bind(this);

  /* Configuration data for this module. To be inserted into the Menu. */
  this.menu_data = [{
      name: 'scene',
      content: {
        description: 'scene',
        settings: {
          camera1_range: {
            description : 'camera1 range',
            type: options.Slider,
            callback: CameraDistance,
            value: 100
          }
        }
      }
    }, {
      name: 'material',
      content: {
        description: 'material',
        settings: {
          wireframe: {
            description: 'Wireframe',
            type: options.SelectBoolean,
            value: false,
            callback: SetWireframe
          }
        }
      }
    }, {
      name: 'renderer',
      content: {
        description: 'renderer',
        settings: {
          enable_webGL: {
            description: 'Enable WebGL',
            type: options.SelectBoolean,
            value: true
          }
        }
      }
    }
  ]

  // Now everything for this module is loaded we can do the initialisation.
  this.init();
}

var Camera = function(width, height){
  this.desired_rotation = undefined;
  this.distance = undefined;

  this.camera = new THREE.PerspectiveCamera(35, width/height, 1, 20000);

  this.setPosition = function(position){
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(new THREE.Vector3(0,0,0));
    if(this.distance === undefined){
      this.distance = this.camera.position.length();
    } else {
      this.camera.position.setLength(this.distance);
    }
  }

  this.setDesiredPosition = function(desired){
    if(desired){
      var desired_copy = desired.clone();
      desired_copy.setLength(this.distance);
      this.desired_rotation = desired_copy.sub(this.camera.position);
      this.desired_direction = new THREE.Vector3(0,0,0);
    }
  }

  this.move = function(x, y){
    var desired = this.camera.position.clone();
    desired.x += x;
    desired.y += y;
    this.setDesiredPosition(desired);
  }

  this.setDistance = function(distance){
    this.camera.near = distance / 1000;
    this.camera.far = distance * 2;
    console.log(distance, this.camera.near, this.camera.far);
    this.camera.updateProjectionMatrix();
    this.distance = distance + planet_radius;
    console.log('Camera.setDistance: ', this.distance);
    this.camera.position.setLength(this.distance);
  }

  this.update = function(){
    var return_val = false;
    if(this.desired_rotation && this.desired_rotation.lengthSq() !== 0){
      var segment_rotation = this.desired_rotation.clone();
      if(this.desired_rotation.lengthSq() > 10){
        segment_rotation.divideScalar(10);
      } else {
        // Last movement frame.
        return_val = true;
      }
      this.camera.position.add(segment_rotation);
      this.desired_rotation.sub(segment_rotation);
    }
    if(this.desired_direction){
      this.camera.lookAt(this.desired_direction);
      this.desired_direction = undefined;
    }
    return return_val;
  }
}

var Cursor = function(scene, views){
  this.scene = scene;
  this.views = views;
  var debug_material = new THREE.LineBasicMaterial({ //transparent: true,
                                                     transparent: false, 
                                                     //depthWrite: false,
                                                     color: 0xff0000 });
  /*var debug_material = new THREE.MeshLambertMaterial({
                                              vertexColors: THREE.VertexColors,
                                              side : THREE.FrontSide,
                                              shading: THREE.SmoothShading,
                                              transparent: true,
                                              depthWrite: false
                                              });*/

  var axis_geometry = new THREE.Geometry();
  axis_geometry.vertices.push(new THREE.Vector3( 0, -100000, 0 ),
      new THREE.Vector3( 0, 100000, 0 ));
  var axis = new THREE.Line( axis_geometry, debug_material );
  scene.scene.add(axis);

  var debug_geometry = new THREE.Geometry();
  debug_geometry.vertices.push(new THREE.Vector3( 0, 0, 0 ),
                               new THREE.Vector3( 0, 0, 15000 ));
  this.debug_line = new THREE.Line( debug_geometry, debug_material );
  scene.scene.add(this.debug_line);

  this.update = function(){
    var mouse_surface_point = false;
    var mouseDirty = false;

    // See if cursor points at planet or anything has changed in any of the views.
    for (var view_index = 0; view_index < this.views.length; view_index++){
      var view = this.views[view_index];
      if(view.mouseDirty){
        mouseDirty = true;
      }
      if(view.mouse_surface_point){
        mouse_surface_point = view.mouse_surface_point;
      }
    }

    var view = this.views[view_index];
    if(mouse_surface_point){
      this.debug_line.visible = true;
    } else {
      this.debug_line.visible = false;
    }

    this.debug_line.lookAt(mouse_surface_point);
  }
}

var viewport_count = 0;
var Viewport = function(width, height, camera, scene, enable_webGL) {
  this.init = function(){
    this.id = 'viewport_' + viewport_count++;
    this.recursion = 1;
    var camera_height = 20000;

    this.camera = camera;
    this.scene = scene;

    camera.setPosition(new THREE.Vector3(0,0, camera_height));

    if(enable_webGL){
      this.renderer = new THREE.WebGLRenderer({/*antialias: true, alpha: true,
          depth: true, sortObjects: true*/});
    } else {
      this.renderer = new THREE.CanvasRenderer();
    }

    this.renderer.setClearColor(0xcccccc);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);

    this.stats = new Stats();
    this.renderer.domElement.appendChild(this.stats.dom);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.mouse_surface_point = undefined;

    if (width && height) {
      this.setSize(width, height);
    } else {
      this.setSize(window.innerWidth, window.innerHeight);
    }

    this.bootstrapPlanet();

    this.renderer.domElement.addEventListener('mousemove', onMouseMove, false);
    this.renderer.domElement.addEventListener('mousedown', onMouseClick, false);
    window.addEventListener('keydown', onKeyPress, false);
  }

  this.setSize = function(width, height) {
    this.renderer.setSize(width, height);
    this.camera.camera.aspect = width / height;
    this.camera.camera.updateProjectionMatrix();
  };

  // We do this here rather than in the Scene object because we want to register
  // all these View objects as being interested in the returned scenery.
  this.bootstrapPlanet = function(){
    var initial_recursion = 6;
    for(var section = 0; section < 8; section++){
      root_face = section * Math.pow(2, 29);

      // TODO Don't hardcode 'viewport_0' here.
      //this.scene.requestLandscape('viewport_0', root_face, 0, 0, initial_recursion);
      this.scene.requestFaceFromCentre([0,0,1], 'viewport_0');
    }
  };

  this.update = function(){
    // Render the scene.
    this.renderer.render(scene.scene, this.camera.camera);

    // Populate this.mouse_surface_point using raycaster from camera to surface.
    if(this.mouseDirty){
      // TODO: This raycasting is slow, using more CPU than anything else.
      // I think we can do better using our own pointToFace().
      this.raycaster.setFromCamera(this.mouse, this.camera.camera); 
      var intersects = this.raycaster.intersectObjects(scene.scene.children);
      this.mouse_surface_point = undefined;
      var deepest_so_far = 0;
      for (var i = 0; i < intersects.length; i++){
        if(intersects[i].object.type === 'Mesh' && 
            intersects[i].object.recursion_min > deepest_so_far &&
            intersects[i].point){
          deepest_so_far = intersects[i].object.recursion;
          this.mouse_surface_point = intersects[i].point;
        }
      }
    }
  }

  var onMouseMove = function(e) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    var posx = 0;
    var posy = 0;
    if (!e) var e = window.event;
    if (e.pageX || e.pageY) 	{
      posx = e.pageX;
      posy = e.pageY;
    }
    else if (e.clientX || e.clientY) 	{
      posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    var bodyRect = document.body.getBoundingClientRect();
    var targetRect = this.renderer.domElement.getBoundingClientRect();
    var offsetx = targetRect.left - bodyRect.left;
    var offsety = targetRect.top - bodyRect.top;

    this.mouse.x = ((posx - offsetx) / this.renderer.domElement.offsetWidth ) * 2 - 1;
    this.mouse.y = -((posy - offsety) / this.renderer.domElement.offsetHeight ) * 2 + 1;
    this.mouseDirty = true;
  }.bind(this);

  var onMouseClick = function(e){
    if(this.mouse_surface_point === undefined){
      return;
    }

    this.camera.setDesiredPosition(this.mouse_surface_point);
    this.centre_view = this.mouse_surface_point;
    this.scene.requestFaceFromCentre(this.mouse_surface_point.clone().toArray(), this.id);

    this.scene.DropShape(this.mouse_surface_point);
  }.bind(this)

  var onKeyPress = function(data){
    console.log(data);
    if(data.key === 'ArrowUp' && data.shiftKey === false && data.ctrlKey === false){
      console.log(game_loop.options);
      if(game_loop.options.data.scene.settings.camera1_range.value > 0){
        game_loop.options.data.scene.settings.camera1_range.callback(
            --game_loop.options.data.scene.settings.camera1_range.value);
      }
    }
    if(data.key === 'ArrowDown' && data.shiftKey === false && data.ctrlKey === false){
      game_loop.options.data.scene.settings.camera1_range.callback(
          ++game_loop.options.data.scene.settings.camera1_range.value);
    }
    if(data.key === 'ArrowUp' && data.shiftKey === true){
      this.camera.move(0, 1);
    }
    if(data.key === 'ArrowDown' && data.shiftKey === true){
      this.camera.move(0, -1);
    }
    if(data.key === 'ArrowUp' && data.ctrlKey === true){
      this.camera.camera.rotateX(0.1);
    }
    if(data.key === 'ArrowDown' && data.ctrlKey === true){
      this.camera.camera.rotateX(-0.1);
    }
    if(data.code === 'ShiftRight'){
      if(this.mouse_surface_point){
        console.log(this.mouse_surface_point);
        this.camera.desired_direction = this.mouse_surface_point.clone();
      }
    }
    if(data.code === 'Space'){
      var existing;
      for(var i = 0; i < this.scene.scene.children.length; i++){
        var existing = this.scene.scene.children[i];
        existing.visible = true;
      }
    }
    if(data.code.startsWith('Digit')){
      var number = parseInt(data.code.split('Digit')[1]);
      console.log(number);
      for(var i = 0; i < this.scene.scene.children.length; i++){
        var existing = this.scene.scene.children[i];
        console.log(existing.type);
        if(existing.type === 'Mesh'){
          if(existing.recursion_min && existing.recursion_min === number){
            existing.visible = true;
          } else {
            existing.visible = false;
          }
        }
      }
    }
  }.bind(this);

  this.init();
};

var Scene = function(enable_webGL){
  this.scene = new THREE.Scene();

  var ambientLight = new THREE.AmbientLight( 0x808080 );
  this.scene.add(ambientLight);

  var pointLight = new THREE.PointLight( 0xc0c0c0, 1, 0 );
  pointLight.position.set( 0,3000,100000 );
  this.scene.add(pointLight);

  this.faces = {};
    
  var deleteMesh = function(old_mesh, scene){
    if(scene){
      scene.remove(old_mesh);
    }
    if(old_mesh.geometry){
      old_mesh.geometry.dispose();
    }
    if(old_mesh.material){
      old_mesh.material.dispose();
    }
    if(old_mesh.texture){
      old_mesh.texture.dispose();
    }
  }

  var replaceMesh = function(old_mesh, new_mesh, scene){
    deleteMesh(old_mesh, scene);
    if(scene){
      scene.add(new_mesh);
    }
  };

  this.addLandscape = function(landscape){
    var existing;
    
    removeOverlappingGeometry(landscape, this.scene);

    for(var i = 0; i < this.scene.children.length; i++){
      var existing = this.scene.children[i];
      if(existing.index_high === landscape.index_high &&
          existing.index_low === landscape.index_low &&
          existing.recursion === landscape.recursion)
      {
        console.log('Replacing:', existing.index_high, existing.index_low, existing.recursion_min,
            'With:     ', landscape.index_high, landscape.index_low, landscape.recursion_min);
        replaceMesh(existing, landscape, this.scene);
        return;
      }
    }
    console.log('Adding:', landscape.index_high, landscape.index_low);
    this.scene.add(landscape);
  };

  this.CreateObject = function(index_high, index_low, recursion, vertices, color) {
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(color, 3));
    //var geometry_temp = new THREE.Geometry().fromBufferGeometry(geometry);
    //geometry_temp.computeFaceNormals();
    //geometry_temp.mergeVertices();
    //geometry_temp.computeVertexNormals();
    //geometry = new THREE.BufferGeometry().fromGeometry(geometry_temp);
    //geometry.computeBoundingBox ();
    //geometry.computeBoundingSphere ();
    //geometry.normalizeNormals ();
    geometry.computeVertexNormals();
    console.log(geometry.getAttribute('color'));
    //console.log(geometry_temp, geometry);

    var material;
    if(enable_webGL){
      material = new THREE.MeshLambertMaterial({
                                              vertexColors: THREE.VertexColors,
                                              side : THREE.FrontSide,
                                              transparent: false, 
                                              });
      /*material = new THREE.MeshPhongMaterial({
                                              vertexColors: THREE.VertexColors,
                                              side : THREE.FrontSide,
                                              transparent: false,
                                              shading: THREE.SmoothShading
                                              });*/
    } else {
      material = new THREE.MeshLambertMaterial( { color: 0xffffff,
                                              side : THREE.FrontSide,
                                              shading: THREE.SmoothShading,
                                              } );
    }

    var return_val = new THREE.Mesh(geometry, material);
    return_val.index_high = index_high;
    return_val.index_low = index_low;
    return_val.recursion = recursion;
    return return_val;
  };
  
  this.RemovePlaceholders = function(){
    for(var i = this.scene.children.length -1; i >= 0; i--){
      var existing = this.scene.children[i];
      if(existing.visible === false && existing.type === 'Object3D'){
        deleteMesh(existing, this.scene);
      }
    }
  }

  this.requestLandscape = function(consumer_id, index_high, index_low, 
                                   recursion_start, required_depth)
  {
    for(var i = 0; i < this.scene.children.length; i++){
      var existing = this.scene.children[i];
      if(existing.index_high === index_high && existing.index_low === index_low &&
          existing.recursion_min === recursion_start)
      {
        return;
      }
    }
    
    // Add a placeholder with the parameters of the expected new object.
    // Used to make sure we don't queue up more than one request for a particular
    // face.
    var placeholder = new THREE.Object3D();
    placeholder.index_high = index_high;
    placeholder.index_low = index_low;
    placeholder.recursion_min = recursion_start;
    placeholder.visible = false;
    this.scene.add(placeholder);

    // Now get the WebWorker to generate us the landscape.
    var task = {cmd: 'landscape', index_high: index_high, index_low: index_low,
      recursion_start: recursion_start, recursion: required_depth, view: consumer_id};
    game_loop.worker_interface.QueueTask('landscape__' + consumer_id, task);
  };

  this.recursion_min = 0;
  this.recursion_max = 14;
  this.recursion_difference = 5;

  this.requestFaceFromCentre = function(centre, view_id){
    game_loop.worker_interface.ClearTasks('face_from_centre__' + view_id);
    game_loop.worker_interface.ClearTasks('landscape__' + view_id);
    this.RemovePlaceholders();
    this.faces[view_id] = {};
    for(var i = this.recursion_min; i <= this.recursion_max; i++){
      var task = { cmd: 'face_from_centre', view: view_id, centre: centre, recursion: i};
      game_loop.worker_interface.QueueTask('face_from_centre__' + view_id, task);
    }
  };

  function isChildAlreadyAdded(draw_these, parent){
    for(var i = 0; i < draw_these.length; i++){
      var child = draw_these[i];
      if(Module.IsChild(parent.index_high, parent.index_low, parent.recursion,
            child.index_high, child.index_low, child.recursion)){
        return true;
      }
    }
  }

  function removeOverlappingParent(draw_these, child){
    for(var i = draw_these.length -1; i >= 0; i--){
      var parent = draw_these[i];
      if(parent.index_high !== undefined &&
         Module.IsChild(parent.index_high, parent.index_low, parent.recursion,
            child.index_high, child.index_low, child.recursion)){
        draw_these.splice(i, 1);
      }
    }
  }

  function removeOverlappingGeometry(new_geometry, scene){
    for(var i = scene.children.length -1; i >= 0; i--){
      var existing_geometry = scene.children[i];
      if(existing_geometry.type === 'Mesh' && existing_geometry.index_high !== undefined){
        if(Module.IsChild(new_geometry.index_high, new_geometry.index_low,
              new_geometry.recursion_min,
            existing_geometry.index_high, existing_geometry.index_low,
              existing_geometry.recursion_min))
        { 
          deleteMesh(existing_geometry, scene);
        } else if(Module.IsChild(existing_geometry.index_high, existing_geometry.index_low,
              existing_geometry.recursion_min,
              new_geometry.index_high, new_geometry.index_low,
              new_geometry.recursion_min))
        { 
          deleteMesh(existing_geometry, scene);
        }
      }
    }
  }

  this.receivedFace = function(face){
    this.faces[face.view][face.recursion] = face;
    
    for(var view in this.faces){
      for(var i = this.recursion_min; i <= this.recursion_max; i++){
        if(this.faces[view][i] === undefined){
          return;
        }
      }
    }

    // All faces have been populated.
    var draw_these = [];
    for(var view in this.faces){
      for(var i = this.recursion_max; i >= this.recursion_min; i--){
        // Add the face it's self.
        if(!isChildAlreadyAdded(draw_these, this.faces[view][i])){
          draw_these.push({index_high: this.faces[view][i].index_high,
                           index_low: this.faces[view][i].index_low,
                           recursion: this.faces[view][i].recursion,
                           required_depth: this.faces[view][i].recursion +
                                           this.recursion_difference});
        }
        removeOverlappingParent(draw_these, this.faces[view][i]);

        // Add any faces adjacent to the primary face.
        var neighbours = this.faces[view][i].neighbours;
        for(var k = 0; k < neighbours.size; k++){
          var neighbour = {index_high: neighbours[k][0],
                           index_low: neighbours[k][1],
                           recursion: this.faces[view][i].recursion,
                           required_depth: this.faces[view][i].recursion +
                                           this.recursion_difference};
          if(!isChildAlreadyAdded(draw_these, neighbour)){
            draw_these.push(neighbour);
          }
          removeOverlappingParent(draw_these, neighbour);

          // Fill in any gaps in partially populated parents.
          for(var f=0; f<4; f++){
            var peer_index = Module.IndexOfChild(neighbour.index_high, neighbour.index_low,
                neighbour.recursion -1, f);
            var peer = {index_high: peer_index[0],
                        index_low: peer_index[1],
                        recursion: neighbour.recursion,
                        required_depth: neighbour.required_depth};
            if(!isChildAlreadyAdded(draw_these, peer)){
              draw_these.push(peer);
            }
          }
        }
      }
    }

    // Now we have a full list of faces to be drawn, actually draw them.
    for(var j = draw_these.length -1; j >= 0; j--){
      //console.log(draw_these[j]);
      this.requestLandscape(face.view, draw_these[j].index_high, draw_these[j].index_low,
                            draw_these[j].recursion, draw_these[j].required_depth);
    }
  }

  this.DropShape = function(position){
    var geometry = new THREE.BoxGeometry( 0.001, 0.001, 1 );
    var material = new THREE.MeshBasicMaterial( { color: 0xff0000, transparent: false } );
    geometry.translate(position.x, position.y, position.z);
    var cube = new THREE.Mesh( geometry, material );
    this.scene.add( cube );
  }
};
