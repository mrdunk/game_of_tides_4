// Copyright 2016 duncan law (mrdunk@gmail.com)

/*global THREE*/

var Camera = undefined;

var Renderer = function(options) {
  // Display statistics.
  this.stats = new Stats();
  document.body.appendChild( this.stats.dom );
  this.rendererStats   = new THREEx.RendererStats();
  this.rendererStats.domElement.style.position = 'absolute';
  this.rendererStats.domElement.style.bottom   = '0px';
  document.body.appendChild( this.rendererStats.domElement );

  this.views = [];  // All registered Viewports.
  this.scene = new THREE.Scene();

  var ambientLight = new THREE.AmbientLight( 0xb0b0b0 );
  this.scene.add(ambientLight);

  //var pointLight = new THREE.PointLight( 0xffffff, 1, 0 );
  //pointLight.position.set( 0,3000,100000 );
  //this.scene.add(pointLight);
  
  
  var debug_material = new THREE.LineBasicMaterial({
    color: 0xff0000
  });

  var axis_geometry = new THREE.Geometry();
  axis_geometry.vertices.push(new THREE.Vector3( 0, -10000, 0 ),
                               new THREE.Vector3( 0, 10000, 0 ));
  var axis = new THREE.Line( axis_geometry, debug_material );
  this.scene.add( axis );

  var debug_geometry = new THREE.Geometry();
  debug_geometry.vertices.push(new THREE.Vector3( 0, 0, 0 ),
                               new THREE.Vector3( 0, 0, 2000 ));
  var debug_line = new THREE.Line( debug_geometry, debug_material );
  this.scene.add(debug_line);


  var Viewport = function(width, height, camera, scene) {
    this.camera = camera;
    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true,
        depth: true, sortObjects: true});
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

    this.update = function(){
      // Render the scene.
      this.renderer.clear();
      this.renderer.render(scene, this.camera.camera);

      // Populate this.mouse_surface_point using raycaster from camera to surface.
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
      
      // Display the cursor line.
      if(this.mouseDirty){
        this.mouseDirty = false;
        if(this.mouse_surface_point){
          debug_line.lookAt(this.mouse_surface_point);
        }
      }

    }

    if (width && height) {
      this.setSize(width, height);
    } else {
      this.setSize(window.innerWidth, window.innerHeight);
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
      this.mouseDirty = 2;
    }.bind(this);
    this.renderer.domElement.addEventListener( 'mousemove', onMouseMove, false );


    var onMouseClick = function(e){
      this.camera.setDesiredPosition(this.mouse_surface_point);
    }.bind(this)
    this.renderer.domElement.addEventListener( 'mousedown', onMouseClick, false );
  };


  this.CreateObject = function(vertices, color, normal) {
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.addAttribute('color', new THREE.BufferAttribute(color, 3));
    geometry.addAttribute('normal', new THREE.BufferAttribute(normal, 3));
    geometry.computeVertexNormals();
    geometry.computeBoundingBox ();
    geometry.computeBoundingSphere ();
    //geometry.normalizeNormals ();

    /*var material = new THREE.MeshPhongMaterial( {
                color: 0xaaaaaa, 
                shininess: 0,
                side: THREE.FrontSide,
                vertexColors: THREE.VertexColors
                                    } );*/

    material = new THREE.MeshLambertMaterial({
                                            vertexColors: THREE.VertexColors,
                                            side : THREE.FrontSide,
                                            shading: THREE.SmoothShading,
                                            });

    return new THREE.Mesh(geometry, material);
  };

  this.addLandscape = function(landscape){
    this.scene.add(landscape);
  }.bind(this);

  this.Update = function(){
    this.stats.update();
    this.rendererStats.update(this.views[0].renderer);

    for (var view_index = 0; view_index < this.views.length; view_index++){
      var view = this.views[view_index];
      view.update();
      view.camera.update();
    }
  };

  this.RegisterView = function(port_width, port_height) {
    var camera = new Camera(port_width, port_height);
    camera.setPosition(new THREE.Vector3(0,0,3000));

    var viewport = new Viewport(port_width, port_height, camera, this.scene);
    this.views.push(viewport);
  }.bind(this);

  var CameraDistance = function(data){
    if(this.views[0]){
      this.views[0].camera.setDistance(data * 100);
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
  this.menu_data = {
    name: "scene",
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
  }

  if(options){
    options.RegisterClient(this);
  }

  // TODO Fix so we don't need 2 separate sections for this.
  this.menu_data = {
    name: "material",
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
  }

  if(options){
    options.RegisterClient(this);
  }
}

var Camera = function(width, height){
  this.desired_rotation = undefined;
  this.distance = undefined;

  this.camera = new THREE.PerspectiveCamera(
      45, width/height, 1, 10000);

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
      desired.setLength(this.distance);
      this.desired_rotation = desired.sub(this.camera.position);
    }
  }

  this.setDistance = function(distance){
    this.distance = distance;
    this.camera.position.setLength(distance);
  }

  this.update = function(){
    if(this.desired_rotation && this.desired_rotation.lengthSq() !== 0){
      this.dirty = true;
      var segment_rotation = this.desired_rotation.clone();
      if(this.desired_rotation.lengthSq() > 100){
        segment_rotation.divideScalar(10);
      }
      this.camera.position.add(segment_rotation);
      this.desired_rotation.sub(segment_rotation);

      this.camera.lookAt(new THREE.Vector3(0,0,0));
    } else {
      this.dirty = undefined;
    }
  }
}
