// Copyright 2016 duncan law (mrdunk@gmail.com)

/*global THREE*/

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
    this.scene = new THREE.Scene();

    var ambientLight = new THREE.AmbientLight( 0x808080 );
    this.scene.add(ambientLight);

    var pointLight = new THREE.PointLight( 0xc0c0c0, 1, 0 );
    pointLight.position.set( 0,3000,100000 );
    this.scene.add(pointLight);

    this.cursor = new Cursor(this.scene, this.views);
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
    if(this.enable_webGL){
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
        
    return return_val;
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
        landscape.renderOrder = landscape.recursion;
       
        this.scene.remove(existing);
        if(existing.geometry){
          existing.geometry.dispose();
        }
        if(existing.material){
          existing.material.dispose();
        }
        //existing.texture.dispose();

        this.scene.add(landscape);
        return;
      }
    }
    console.log('Adding:', landscape.index_high, landscape.index_low);
    landscape.renderOrder = landscape.recursion;
    this.scene.add(landscape);
    console.log(this.scene);
  }.bind(this);

  // TODO Maybe the Scene should be it's own object and this a member of that?
  this.pruneLandscape = function(){
    // Expensive due to nested for loops. Only do this if we know a view is dirty.
    for(var s = this.scene.children.length -1; s >= 0; s--){
      var child = this.scene.children[s];
      if(child.type === 'Mesh'){
        var found = false;
        for(var v = 0; v < this.views.length; v++){
          var view = this.views[v];
          for(var n = 0; n < view.view_tiles.length; n++){
            var view_tile = view.view_tiles[n];
            if(view_tile[0] === child.index_high &&
               view_tile[1] === child.index_low &&
               view_tile[2] === child.recursion)
            {
              found = true;
              break;
            }
          }
          if(found){ break; }
        }
        if(!found){
          this.scene.remove(child);
          child.geometry.dispose();
          child.material.dispose();
          //child.texture.dispose();
        }
      }
    }
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
      this.pruneLandscape();
    }
  };

  this.RegisterView = function(port_width, port_height) {
    var camera = new Camera(port_width, port_height);

    var viewport = new Viewport(port_width, port_height, camera, this.scene, this.enable_webGL);
    this.views.push(viewport);
  }.bind(this);

  var CameraDistance = function(data){
    if(this.views[0]){
      this.views[0].camera.setDistance(data * 1000);
    }
  }.bind(this);

  var SetWireframe = function(data) {
    for(var i in this.scene.children){
      if(this.scene.children[i].type === 'Mesh' &&
          this.scene.children[i].material !== undefined){
        this.scene.children[i].material.wireframe = data;
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

  this.camera = new THREE.PerspectiveCamera(45, width/height, 1, 100000);

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
    this.distance = distance;
    this.camera.position.setLength(distance);
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
  scene.add( axis );

  var debug_geometry = new THREE.Geometry();
  debug_geometry.vertices.push(new THREE.Vector3( 0, 0, 0 ),
                               new THREE.Vector3( 0, 0, 15000 ));
  this.debug_line = new THREE.Line( debug_geometry, debug_material );
  scene.add(this.debug_line);

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

var Viewport = function(width, height, camera, scene, enable_webGL) {
  this.recursion = 1;
  this.camera_height = 20000;
  this.view_tiles = [[0, 0, 4],];

  this.camera = camera;
  this.scene = scene;

  camera.setPosition(new THREE.Vector3(0,0,this.camera_height));

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
  this.renderer.domElement.appendChild( this.stats.dom );

  this.raycaster = new THREE.Raycaster();
  this.mouse = new THREE.Vector2();
  this.mouse_surface_point = undefined;

  this.setSize = function(width, height) {
    this.renderer.setSize(width, height);
    this.camera.camera.aspect = width / height;
    this.camera.camera.updateProjectionMatrix();
  };

  if (width && height) {
    this.setSize(width, height);
  } else {
    this.setSize(window.innerWidth, window.innerHeight);
  }

  this.update = function(){
    // Render the scene.
    this.renderer.render(scene, this.camera.camera);

    // Populate this.mouse_surface_point using raycaster from camera to surface.
    if(this.mouseDirty){
      // TODO: This raycasting is slow, using more CPU than anything else.
      // I think we can do better using our own pointToFace().
      this.raycaster.setFromCamera(this.mouse, this.camera.camera); 
      var intersects = this.raycaster.intersectObjects(scene.children);
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
  this.renderer.domElement.addEventListener( 'mousemove', onMouseMove, false );

  var onMouseClick = function(e){
    if(this.mouse_surface_point === undefined){
      return;
    }

    this.camera.setDesiredPosition(this.mouse_surface_point);
		this.requestLandscapeView();
  }.bind(this)
  this.renderer.domElement.addEventListener( 'mousedown', onMouseClick, false );

  // TODO: Should this really live in the Viewport?
  this.requestLandscape = function(index_high, index_low, 
                                   recursion_start, required_depth){
    for(var i = 0; i < this.scene.children.length; i++){
      var existing = this.scene.children[i];
      if(existing.index_high === index_high && existing.index_low === index_low &&
          existing.recursion === required_depth)
      {
        console.log('Already exists.');
        return;
      }
    }

    // Add a placeholder with the peramiters of the expected new object.
    var placeholder = new THREE.Object3D();
    placeholder.index_high = index_high;
    placeholder.index_low = index_low;
    placeholder.recursion = required_depth;
    placeholder.visible = false;
    this.scene.add(placeholder);

    // Now get the WebWorker to generate us the landscape.
    game_loop.worker_interface.worker.postMessage({ cmd: 'landscape',
                                                    index_high: index_high,
                                                    index_low: index_low,
                                                    recursion_start: recursion_start,
                                                    recursion: required_depth });
  }.bind(this);

  // TODO Better name.
  this.requestLandscapeView = function(){
    this.view_tiles = [];
   
    var terrain_generator = new Module.DataSourceGenerate();  // Share an existing copy?
    var mouse_surface_point_copy = this.mouse_surface_point.clone().toArray();
    console.log("+");
    // TODO Optimize pointToFace() or run in WebWorker;
    var face = terrain_generator.pointToFace(mouse_surface_point_copy, this.recursion);
    console.log("-");
    terrain_generator.delete();

    //console.log(face.index_high.toString(16));

    this.requestLandscape(face.index_high, face.index_low, this.recursion, this.recursion +5);
    this.view_tiles.push([face.index_high, face.index_low, this.recursion +5]);

    var neighbours = face.neighbours;
    for(var i = 0; i < neighbours.size(); i++){
      var neighbour = neighbours.get(i);
      this.requestLandscape(neighbour[0], neighbour[1], this.recursion, this.recursion +5);
      this.view_tiles.push([neighbour[0], neighbour[1], this.recursion +5]);
    }

    this.recursion++;
    this.dirty = true;
    face.delete();
  }
};

