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

    var combined_view_dirty = false;
    for (var view_index = 0; view_index < this.views.length; view_index++){
      var view = this.views[view_index];
      view.mouseDirty = undefined;
      combined_view_dirty |= view.dirty;
      view.dirty = undefined;
    }

    if(combined_view_dirty){
      //TODO Want to delay calling this until better resolution has been drawn.
      this.scene.pruneLandscape();
    }
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
            value: 5
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

  this.camera = new THREE.PerspectiveCamera(35, width/height, 1, 100000);

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
    }
  }

  this.setDistance = function(distance){
    this.distance = distance + planet_radius;
    console.log('Camera.setDistance: ', this.distance);
    this.camera.position.setLength(this.distance);
  }

  this.update = function(){
    var return_val = false;
    if(this.desired_rotation && this.desired_rotation.lengthSq() !== 0){
      var segment_rotation = this.desired_rotation.clone();
      if(this.desired_rotation.lengthSq() > 100){
        segment_rotation.divideScalar(10);
      } else {
        // Last movement frame.
        return_val = true;
      }
      this.camera.position.add(segment_rotation);
      this.desired_rotation.sub(segment_rotation);

      this.camera.lookAt(new THREE.Vector3(0,0,0));
    }
    return return_val;
  }
}

var Cursor = function(scene, views){
  this.scene = scene;
  this.views = views;
  var debug_material = new THREE.LineBasicMaterial({ color: 0xff0000 });

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
      this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true,
          depth: true, sortObjects: true});
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
      this.scene.requestLandscape(this, root_face, 0, 0, initial_recursion);
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
      for (var i = 0; i < intersects.length; i++){
        if(intersects[i].object.type === 'Mesh'){
          this.mouse_surface_point = intersects[i].point;
          if(this.mouse_surface_point){
            break;
          }
        }
      }
    }
  }

  // TODO Better name.
  this.requestLandscapeView = function(centre){
    if(centre === undefined){
      return;
    }

    this.scene.unregisterConsumerFromAll(this);

    var centre_copy = centre.clone().toArray();
    
    this.scene.requestFaceFromCentre(centre_copy, this.recursion);
    
    // TODO Fix this.
    this.dirty = true;
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
		this.requestLandscapeView(this.mouse_surface_point);
  }.bind(this)

  var onKeyPress = function(data){
    console.log(data);
    if(data.key === 'ArrowUp' && this.recursion < 15){
      this.recursion++;
      this.requestLandscapeView(this.centre_view);
      //this.camera.setDistance(planet_radius / Math.pow(2, this.recursion));
    }
    if(data.key === 'ArrowDown' && this.recursion > 1){
      this.recursion--;
      this.requestLandscapeView(this.centre_view);
      //this.camera.setDistance(planet_radius / Math.pow(2, this.recursion));
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
    new_mesh.renderOrder = new_mesh.recursion;
    new_mesh.registered_consumers = old_mesh.registered_consumers;
    deleteMesh(old_mesh, scene);
    if(scene){
      scene.add(new_mesh);
    }
  };

  this.addLandscape = function(landscape){
    var existing;
    for(var i = 0; i < this.scene.children.length; i++){
      var existing = this.scene.children[i];
      if(existing.index_high === landscape.index_high &&
          existing.index_low === landscape.index_low &&
          existing.recursion === landscape.recursion)
      {
        console.log('Replacing:', existing.index_high, existing.index_low, existing.recursion);
        console.log('With:     ', landscape.index_high, landscape.index_low, landscape.recursion);
        replaceMesh(existing, landscape, this.scene);
        return;
      }
    }
    console.log('Adding:', landscape.index_high, landscape.index_low);
    landscape.renderOrder = landscape.recursion;
    this.scene.add(landscape);
  };

  this.pruneLandscape = function(){
    // Expensive due to nested for loops. Only do this if we know a view is dirty.
    console.log('pruneLandscape()');
    for(var s = this.scene.children.length -1; s >= 0; s--){
      var child = this.scene.children[s];
      if(child.type === 'Mesh'){
        if(child.registered_consumers.length === 0){
          deleteMesh(child, this.scene);
        }
      }
    }
  }
  
  this.CreateObject = function(index_high, index_low, recursion, vertices, color) {
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(color, 3));
    geometry.computeVertexNormals();
    geometry.computeBoundingBox ();
    geometry.computeBoundingSphere ();
    geometry.normalizeNormals ();

    var material;
    if(enable_webGL){
      material = new THREE.MeshLambertMaterial({
                                              vertexColors: THREE.VertexColors,
                                              side : THREE.FrontSide,
                                              shading: THREE.SmoothShading,
                                              transparent: true,
                                              depthWrite: false
                                              });
    } else {
      material = new THREE.MeshLambertMaterial( { color: 0xffffff,
                                              side : THREE.FrontSide,
                                              shading: THREE.SmoothShading,
                                              transparent: true,
                                              depthWrite: false
                                              } );
    }

    var return_val = new THREE.Mesh(geometry, material);
    return_val.index_high = index_high;
    return_val.index_low = index_low;
    return_val.recursion = recursion;
    return_val.registered_consumers = [];
        
    return return_val;
  };
  
  // TODO: Landscape Mesh as it's own object?
  var registerMeshConsumer = function(mesh, consumer){
    mesh.registered_consumers = (mesh.registered_consumers || []);
    for(var i = 0; i < mesh.registered_consumers.length; i++){
      if(mesh.registered_consumers[i].id === consumer.id){
        // Already registered.
        return true;
      }
    }
    mesh.registered_consumers.push(consumer);
  }

  var unregisterMeshConsumer = function(mesh, consumer){
    mesh.registered_consumers = mesh.registered_consumers || [];
    for(var i = 0; i < mesh.registered_consumers.length; i++){
      if(mesh.registered_consumers[i].id === consumer.id){
        mesh.registered_consumers.splice(i, 1);
        return true;
      }
    }
  }

  this.unregisterConsumerFromAll = function(consumer){
    for(var m = 0; m < this.scene.children.length; m++){
      var mesh = this.scene.children[m];
      unregisterMeshConsumer(mesh, consumer);
    }
  };

  this.requestLandscape = function(consumer, index_high, index_low, 
                                   recursion_start, required_depth)
  {
    for(var i = 0; i < this.scene.children.length; i++){
      var existing = this.scene.children[i];
      if(existing.index_high === index_high && existing.index_low === index_low &&
          existing.recursion === required_depth)
      {
        console.log('Already exists.');
        registerMeshConsumer(existing, consumer);
        return;
      }
    }

    // Add a placeholder with the parameters of the expected new object.
    var placeholder = new THREE.Object3D();
    placeholder.index_high = index_high;
    placeholder.index_low = index_low;
    placeholder.recursion = required_depth;
    placeholder.visible = false;
    registerMeshConsumer(placeholder, consumer);
    this.scene.add(placeholder);

    // Now get the WebWorker to generate us the landscape.
    game_loop.worker_interface.worker.postMessage({ cmd: 'landscape',
                                                    index_high: index_high,
                                                    index_low: index_low,
                                                    recursion_start: recursion_start,
                                                    recursion: required_depth });
  };

  this.requestFaceFromCentre = function(centre, recursion){
    game_loop.worker_interface.worker.postMessage({ cmd: 'face_from_centre',
                                                    centre: centre,
                                                    recursion: recursion});
  };

  this.requestLandscapeArroundFace = function(face){
    this.unregisterConsumerFromAll(this);
    
    this.requestLandscape(this, face.index_high, face.index_low,
        face.recursion, face.recursion +7);

    var neighbours = face.neighbours;
    for(var i = 0; i < neighbours.size; i++){
      var neighbour = neighbours[i];
      this.requestLandscape(this, neighbour[0], neighbour[1],
                            face.recursion, face.recursion +7);
    }
  }
};
